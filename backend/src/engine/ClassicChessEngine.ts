import { Chess, Color, Square } from "chess.js";
import { IGameEngine, Move } from "./IGameEngine";
import { GameSocket } from "../sockets/socketHandlers";
import { Server } from "socket.io";
import { TimeoutPayload } from "../sockets/socketPayloads";
import { ActiveTournament } from "../sockets/socketHandlers/tournaments/swissTournamentLogic/types";
import { ActiveSpecialGame } from "./special/types";
import { VariantRegistry } from "./special/variants/VariantRegistry";

export interface ClassicChessEngineParams {
    whitePlayerId: string;
    blackPlayerId: string;
    io: Server;
    tcMinutes: number;
    tcBonus: number;
    gameId: string;
    gameEngines: Map<string, IGameEngine>;
    socketsByPlayerId: Map<string, GameSocket>;
    tournaments: Map<string, ActiveTournament>;
    onTimeout: (io: Server, payload: TimeoutPayload, gameEngines: Map<string, IGameEngine>,
                socketsByPlayerId: Map<string, GameSocket>, tournaments: Map<string, ActiveTournament>,
                specialGames: Map<string, ActiveSpecialGame>, variantRegistry: VariantRegistry) => void;
    fen?: string;
    specialGames: Map<string, ActiveSpecialGame>;
    variantRegistry: VariantRegistry;
}

export class ClassicChessEngine implements IGameEngine {
    private chess: Chess;
    private whitePlayerId: string;
    private blackPlayerId: string;
    private gameId: string;
    private whiteTime: number;
    private blackTime: number;
    private whiteDrawOffered: boolean = false;
    private blackDrawOffered: boolean = false;
    private lastTime: number;
    private io: Server;
    private gameEngines: Map<string, IGameEngine>;
    private timer?: NodeJS.Timeout;
    private readonly tcBonus: number;
    private socketsByPlayerId: Map<string, GameSocket>;
    private tournaments: Map<string, ActiveTournament>;
    private onTimeout: (io: Server, payload: TimeoutPayload, gameEngines: Map<string, IGameEngine>,
                        socketsByPlayerId: Map<string, GameSocket>, tournaments: Map<string, ActiveTournament>,
                        specialGames: Map<string, ActiveSpecialGame>, variantRegistry: VariantRegistry) => void;
    private specialGames: Map<string, ActiveSpecialGame>;
    private variantRegistry: VariantRegistry;

    constructor(params: ClassicChessEngineParams) {

        this.chess = new Chess(params.fen);
        this.whitePlayerId = params.whitePlayerId;
        this.blackPlayerId = params.blackPlayerId;
        this.gameId = params.gameId;

        this.io = params.io;
        this.gameEngines = params.gameEngines;
        this.socketsByPlayerId = params.socketsByPlayerId;
        this.tournaments = params.tournaments;
        this.specialGames = params.specialGames;
        this.variantRegistry = params.variantRegistry;

        const initialTime = params.tcMinutes * 60 * 1000;
        this.whiteTime = initialTime;
        this.blackTime = initialTime;
        this.lastTime = Date.now();
        this.tcBonus = params.tcBonus * 1000;
        this.onTimeout = params.onTimeout;
        this.timer = setInterval(() => this.updateClocks(), 200);
    }


    private updateClocks() {
        const now = Date.now();
        const elapsed = now - this.lastTime;
        const turn = this.chess.turn();

        if (turn === "w") {
            this.whiteTime -= elapsed;
            if (this.whiteTime <= 0) {
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
            this.blackTime -= elapsed;
            if (this.blackTime <= 0) {
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

    getCurrentPlayer(): Color {
        return this.chess.turn();
    }

    getPgn(): string {
        return this.chess.pgn({ newline: " "});
    }

    getFen(): string {
        return this.chess.fen();
    }

    getWhiteTime(): number {
        return this.whiteTime;
    }

    getBlackTime(): number {
        return this.blackTime;
    }

    canUndo(): boolean {
        return this.chess.history().length > 0;
    }

    undo(): string | undefined {
        if (this.chess.undo()){
            return this.chess.pgn();
        }
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

    getValidMoves(from?: string): Move[] {
        const moves = this.chess.moves({ square: from as Square | undefined, verbose: true });
        return moves.map(m => ({
            from: m.from,
            to: m.to,
            promotion: m.promotion as Move["promotion"] | undefined,
        }));
    }

    makeMove(move: Move): boolean {
        if (!this.getValidMoves(move.from).some(m => m.from === move.from && m.to === move.to)) {
            return false;
        }

        const result = this.chess.move(move);
        if (result) {
            if (result.color === "w") {
                this.whiteTime += this.tcBonus;
            } else {
                this.blackTime += this.tcBonus;
            }
            this.whiteDrawOffered = false;
            this.blackDrawOffered = false;
            return true;
        }
        return false;
    }

    isValidMove(move: Move): boolean {
        return this.chess
            .moves({ square: move.from as Square | undefined, verbose: true })
            .some(m => m.to === move.to && m.promotion === move.promotion);
    }

    isGameOver(): boolean {
        return this.chess.isGameOver();
    }

    getWinner(): "w" | "b" | null {
        if (this.whiteTime <= 0) return "b";
        if (this.blackTime <= 0) return "w";

        if (!this.chess.isGameOver()) return null;
        if (this.chess.isCheckmate()) {
            return this.chess.turn() === "w" ? "b" : "w";
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
        this.chess = new Chess(fen);
    }
}
