import { Chess, Color } from "chess.js";
import { IGameEngine, Move, SpecialParams } from "./IGameEngine";
import { ActiveSpecialGame, AfterMoveChanges, AfterMoveParams, IChessVariant,
    ISpecialUpgrade, SpecialChessContext, UpgradeDetails } from "./special/types";
import { VariantRegistry } from "./special/variants/VariantRegistry";
import { UpgradeRegistry } from "./special/upgrades/UpgradeRegistry";
import { Server } from "socket.io";
import { GameSocket } from "../sockets/socketHandlers";
import { TimeoutPayload, ValidSpecialMoveWithAfterFen } from "../sockets/socketPayloads";
import { ActiveTournament } from "../sockets/socketHandlers/tournaments/swissTournamentLogic/types";
import { SpecialConfigurationNormal } from "../specialGame/types";
import { ExtraTurnUpgrade } from "./special/upgrades/ExtraTurnUpgrade";
import { UpgradeKey } from "@prisma/client";


export interface SpecialChessEngineParams {
    whitePlayerId: string;
    blackPlayerId: string;
    configuration: SpecialConfigurationNormal;
    io: Server;
    tcMinutes: number;
    tcBonus: number;
    gameId: string;
    gameEngines: Map<string, IGameEngine>;
    socketsByPlayerId: Map<string, GameSocket>;
    tournaments: Map<string, ActiveTournament>;
    specialGames: Map<string, ActiveSpecialGame>;
    onTimeout: (io: Server, payload: TimeoutPayload, gameEngines: Map<string, IGameEngine>,
                socketsByPlayerId: Map<string, GameSocket>, tournaments: Map<string, ActiveTournament>,
                specialGames: Map<string, ActiveSpecialGame>, variantRegistry: VariantRegistry) => void;
    variantRegistry?: VariantRegistry;
    upgradeRegistry?: UpgradeRegistry;
}

export class SpecialChessEngine implements IGameEngine {
    private chess: Chess;
    private readonly variant: IChessVariant;
    private readonly upgrades: ISpecialUpgrade[];
    private readonly whitePlayerId: string;
    private readonly blackPlayerId: string;
    private readonly gameId: string;
    private whiteTimeMs: number;
    private blackTimeMs: number;
    private whiteDrawOffered: boolean = false;
    private blackDrawOffered: boolean = false;
    private lastTime: number;
    private readonly tcMinutesMs: number;
    private readonly tcBonusMs: number;
    private readonly io: Server;
    private readonly gameEngines: Map<string, IGameEngine>;
    private readonly socketsByPlayerId: Map<string, GameSocket>;
    private readonly tournaments: Map<string, ActiveTournament>;
    private specialGames: Map<string, ActiveSpecialGame>;
    private readonly onTimeout: (io: Server, payload: TimeoutPayload, gameEngines: Map<string, IGameEngine>,
                                 socketsByPlayerId: Map<string, GameSocket>, tournaments: Map<string, ActiveTournament>,
                                 specialGames: Map<string, ActiveSpecialGame>, variantRegistry: VariantRegistry) => void;
    private timer?: NodeJS.Timeout;
    private configuration: SpecialConfigurationNormal;
    private variantRegistry: VariantRegistry;

    constructor(params: SpecialChessEngineParams) {
        this.variantRegistry = params.variantRegistry ?? new VariantRegistry();
        const upgradeRegistry = params.upgradeRegistry ?? new UpgradeRegistry();
        this.configuration = params.configuration;
        const variant = this.variantRegistry.getVariant(this.configuration.variantKey);
        if (!variant) {
            throw new Error(`Unknown variant: ${this.configuration.variantKey}`);
        }

        const resolvedUpgrades: ISpecialUpgrade[] = [];
        this.configuration.upgradeKeys.forEach(upgradeKey => {
            const upgrade = upgradeRegistry.getUpgrade(upgradeKey);
            if (upgrade) {
                resolvedUpgrades.push(upgrade);
            }
        });

        this.whitePlayerId = params.whitePlayerId;
        this.blackPlayerId = params.blackPlayerId;
        this.variant = variant;
        this.upgrades = resolvedUpgrades;
        this.chess = new Chess();
        this.io = params.io;
        this.gameEngines = params.gameEngines;
        this.socketsByPlayerId = params.socketsByPlayerId;
        this.tournaments = params.tournaments;
        this.specialGames = params.specialGames;
        this.gameId = params.gameId;

        const initialTime = params.tcMinutes * 60 * 1000;
        this.whiteTimeMs = initialTime;
        this.blackTimeMs = initialTime;
        this.lastTime = Date.now();
        this.tcMinutesMs = params.tcMinutes * 1000 * 60;
        this.tcBonusMs = params.tcBonus * 1000;
        this.onTimeout = params.onTimeout;
        this.timer = setInterval(() => this.updateClocks(), 200);

        this.initializeGame();
    }

    static deserializeConfiguration(serialized: string): SpecialConfigurationNormal {
        return JSON.parse(serialized) as SpecialConfigurationNormal;
    }

    exportConfiguration(): string {
        return JSON.stringify(this.configuration);
    }

    private initializeGame(): void {
        this.variant.setupBoard({
            chess: this.chess,
        });
        this.upgrades.forEach(upgrade => upgrade.initialize?.(this.getContext()));
    }

    private getContext(): SpecialChessContext {
        return {
            chess: this.chess,
            configuration: this.configuration,
            variant: this.variant,
        };
    }

    private updateClocks() {
        const now = Date.now();
        const elapsed = now - this.lastTime;
        const turn = this.chess.turn();

        if (turn === "w") {
            this.whiteTimeMs -= elapsed;
            if (this.whiteTimeMs <= 0) {
                const payload: TimeoutPayload = {
                    gameId: this.gameId,
                    winnerId: this.blackPlayerId,
                    loserId: this.whitePlayerId,
                };
                this.stop();
                this.onTimeout(this.io, payload, this.gameEngines, this.socketsByPlayerId,
                               this.tournaments, this.specialGames, this.variantRegistry);
            }
        } else {
            this.blackTimeMs -= elapsed;
            if (this.blackTimeMs <= 0) {
                const payload: TimeoutPayload = {
                    gameId: this.gameId,
                    winnerId: this.whitePlayerId,
                    loserId: this.blackPlayerId,
                };
                this.stop();
                this.onTimeout(this.io, payload, this.gameEngines, this.socketsByPlayerId,
                               this.tournaments, this.specialGames, this.variantRegistry);
            }
        }

        this.lastTime = now;
    }

    private stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    dispose(): void {
        this.stop();
    }

    getPgn(): string {
        return this.chess.pgn({ newline: " "});
    }

    getFen(): string {
        return this.chess.fen();
    }

    getWhiteTime(): number {
        return this.whiteTimeMs;
    }

    getBlackTime(): number {
        return this.blackTimeMs;
    }

    getCurrentPlayer(): Color {
        return this.chess.turn();
    }

    canUndo(): boolean {
        return false;
    }

    undo(): string | undefined {
        return undefined;
    }

    offerDraw(color: Color): void {
        if (color === "w") {
            this.whiteDrawOffered = true;
        }
        else {
            this.blackDrawOffered = true;
        }
    }

    declineDraw(color: Color): void {
        if (color === "w") {
            this.blackDrawOffered = false;
        }
        else {
            this.whiteDrawOffered = false;
        }
    }

    isOfferedDraw(color: Color): boolean {
        if (color === "w") {
            return this.whiteDrawOffered;
        }
        return this.blackDrawOffered;
    }

    getValidSpecialMovesWithAfterFens(from?: string, specialParams?: SpecialParams): ValidSpecialMoveWithAfterFen[] {
        let validSpecialMoves: Move[] = [];
        if (this.variant.getValidSpecialMoves) {
            validSpecialMoves.push(...this.variant.getValidSpecialMoves({ chess: this.chess, from }));
        }
        this.upgrades.forEach(upgrade => {
            if (upgrade.modifyValidMoves) {
                validSpecialMoves = upgrade.modifyValidMoves(this.getContext(), validSpecialMoves, from);
            }
        });

        const validSpecialMovesWithAfterFens: ValidSpecialMoveWithAfterFen[] = validSpecialMoves.map(validMove => ({
            ...validMove,
            afterFen: this.getPseudoAfterMoveFen(validMove, specialParams),
        }));
        return validSpecialMovesWithAfterFens;
    }

    getUpgradesDetails(): Map<UpgradeKey, UpgradeDetails> {
        const detailsMap: Map<UpgradeKey, UpgradeDetails> = new Map();
        this.upgrades.forEach(upgrade => {
            const details = upgrade.getUpgradeDetails();
            detailsMap.set(upgrade.key as UpgradeKey, details);
        });
        return detailsMap;
    }

    getValidMoves(from?: string): Move[] {
        let moves = this.variant.getValidMoves({ chess: this.chess, from });
        this.upgrades.forEach(upgrade => {
            moves = upgrade.modifyValidMoves ? upgrade.modifyValidMoves(this.getContext(), moves, from) : moves;
        });
        return moves;
    }

    makeMove(move: Move, specialParams?: SpecialParams): boolean {
        const movingColor = this.chess.turn();
        let preparedMove: Move | null = move;

        this.upgrades.forEach(upgrade => {
            if (preparedMove) {
                const handledByBefore = preparedMove.special;
                const suggestedMove = upgrade.beforeMove
                    ? upgrade.beforeMove({ ...this.getContext(), move: preparedMove })
                    : preparedMove;

                if (suggestedMove && suggestedMove.handledByUpgrade) {
                    if (suggestedMove.special !== handledByBefore) {
                        throw new Error("Multiple upgrades handled the move");
                    }
                    preparedMove = suggestedMove;
                }
            }
        });

        if (!preparedMove) return false;
        const readyMove: Move = preparedMove;

        let applied = false;
        if (readyMove.handledByUpgrade === true) {
            applied = true;
        }
        else
        {
            applied = this.variant.applyMove({ chess: this.chess, move: readyMove });
        }

        if (applied) {
            if (movingColor === "w") {
                this.whiteTimeMs += this.tcBonusMs;
            } else {
                this.blackTimeMs += this.tcBonusMs;
            }
            this.whiteDrawOffered = false;
            this.blackDrawOffered = false;
        }

        const afterMoveParams: AfterMoveParams = {
            tcMinutes: this.tcMinutesMs / 1000 / 60,
            tcBonus: this.tcBonusMs / 1000,
            extraTurn: specialParams?.useExtraTurn ?? false,
        };

        this.upgrades.forEach((upgrade) => {
            if (upgrade.afterMove) {
                const afterMoveChanges = upgrade.afterMove({ ...this.getContext(), move: readyMove }, applied, afterMoveParams);
                this.applyAfterMoveChanges(afterMoveChanges, movingColor);
            }
        });
        return applied;
    }

    isValidMove(move: Move): boolean {
        return this.getValidMoves(move.from).some(validMove =>
            validMove.from === move.from &&
            validMove.to === move.to &&
            validMove.promotion === move.promotion,
        );
    }

    isGameOver(): boolean {
        if (this.whiteTimeMs <= 0 || this.blackTimeMs <= 0) {
            return true;
        }

        for (const upgrade of this.upgrades) {
            const override = upgrade.isGameOver?.(this.getContext());
            if (override !== null && override !== undefined) {
                return override;
            }
        }

        if (this.variant.isGameOver) {
            return this.variant.isGameOver({ chess: this.chess });
        }

        return this.chess.isGameOver();
    }

    getWinner(): "w" | "b" | null {
        if (this.whiteTimeMs <= 0) return "b";
        if (this.blackTimeMs <= 0) return "w";

        for (const upgrade of this.upgrades) {
            const winner = upgrade.getWinner?.(this.getContext());
            if (winner !== undefined && winner !== null) {
                return winner;
            }
        }

        if (this.variant.getWinner) {
            const variantWinner = this.variant.getWinner({ chess: this.chess });
            if (variantWinner !== null) {
                return variantWinner;
            }
        }

        return null;
    }

    getWinnerId(): string | undefined {
        const winner = this.getWinner();
        return winner === "w" ? this.whitePlayerId 
             : winner === "b" ? this.blackPlayerId 
                              : undefined;
    }

    reset(fen?: string): void {
        this.chess = new Chess();
        this.configuration = {
            ...this.configuration,
        };
        this.initializeGame();
    }

    private getPseudoAfterMoveFen(move: Move, specialParams?: SpecialParams): string {
        const pseudoChess = new Chess(this.chess.fen());
        const pseudoVariant = this.variant.cloneWithState(this.chess, pseudoChess);
        const pseudoContext: SpecialChessContext = {
            chess: pseudoChess,
            configuration: this.configuration,
            variant: pseudoVariant,
        };

        const clonedUpgrades = this.upgrades.map(upgrade => upgrade.clone());

        let preparedPseudoMove: Move | null = move;
        clonedUpgrades.forEach(clonedUpgrade => {
            if (preparedPseudoMove) {
                const handledByBefore = preparedPseudoMove.special;
                const suggestedPseudoMove = clonedUpgrade.beforeMove 
                    ? clonedUpgrade.beforeMove({ ...pseudoContext, move: preparedPseudoMove })
                    : preparedPseudoMove;
                
                if (suggestedPseudoMove && suggestedPseudoMove.handledByUpgrade) {
                    if (suggestedPseudoMove.special !== handledByBefore) {
                        throw new Error("Multiple upgrades handled the move");
                    }
                    preparedPseudoMove = suggestedPseudoMove;
                }
            }
        });

        if (!preparedPseudoMove) return this.chess.fen();;
        const readyMove: Move = preparedPseudoMove;

        let applied = false;
        if (readyMove.handledByUpgrade === true) {
            applied = true;
        }
        else
        {
            applied = pseudoVariant.applyMove({ chess: pseudoChess, move: readyMove });
        }

        const afterMoveParams: AfterMoveParams = {
            tcMinutes: this.tcMinutesMs / 1000 / 60,
            tcBonus: this.tcBonusMs / 1000,
            extraTurn: specialParams?.useExtraTurn ?? false,
        };

        clonedUpgrades.forEach(clonedUpgrade => {
            const afterMoveChanges = clonedUpgrade.afterMove?.({ ...pseudoContext, move: readyMove }, applied, afterMoveParams);
            if (afterMoveChanges) {
                if (clonedUpgrade instanceof ExtraTurnUpgrade && afterMoveChanges.fen !== undefined) {
                    pseudoChess.load(afterMoveChanges.fen);
                }
            }
        });

        return applied ? pseudoChess.fen() : this.chess.fen();
    }

    private applyAfterMoveChanges(changes: AfterMoveChanges | undefined, movingColor: Color): void {
        if (!changes) return;

        if (movingColor === "w") {
            this.whiteTimeMs += changes.timeMsAdded;
        }
        else {
            this.blackTimeMs += changes.timeMsAdded;
        }
        if (changes.fen !== undefined) {
            this.chess.load(changes.fen);
        }
    }
}
