import { Chess } from "chess.js";
import { Move } from "../IGameEngine";
import { Color, GameMode, GameResult, MatchType, TimeControl, VariantKey } from "@prisma/client";
import { Server } from "socket.io";
import { SpecialConfigurationNormal } from "../../specialGame/types";


export interface ActiveSpecialGame {
    id: string;
    players: SpecialGamePlayer[];
    standings: Map<string, SpecialGamePlayerStanding>;
    rounds: SpecialGameRound[];
    currentRoundIndex: number;
    totalRounds: number;
    isFinished: boolean;
    gameMode: GameMode;
    matchType: MatchType;
    timeControl: TimeControl;
    tcMinutes: number;
    tcBonus: number;
    matchesByGameId: Map<string, { roundIndex: number; matchId: string }>;
    configuration: SpecialConfigurationNormal;
};

export interface SpecialGameRound {
    id: string;
    roundNumber: number;
    matches: SpecialGameMatch[];
    isComplete: boolean;
};

export interface SpecialGameMatch {
    id: string;
    roundNumber: number;
    whitePlayerId: string | null;
    blackPlayerId: string | null;
    isBye: boolean;
    gameId?: string;
    winnerId?: string;
    result?: GameResult;
    isComplete: boolean;
};

export interface SpecialGamePlayer {
    id: string;
    elo: number;
    seed: number;
};

export interface SpecialGamePlayerStanding {
    playerId: string;
    score: number;
    colorHistory: Color[];
    lastColor: Color | null;
    whiteCount: number;
    blackCount: number;
    hasBye: boolean;
    opponents: Set<string>;
};

export interface SpecialGameLeaderboardDbEntry {
    playerId: string,
    roundIndex: number,
    score: number,
};

export interface VariantMetadata {
    key: VariantKey;
    name: string;
    maximumCapacity: number;
    minimumCapacity: number;
    totalRounds: number;
    description?: string;
}

export interface VariantSetupContext {
    chess: Chess;
    customStartingFen?: string;
}

export interface VariantMoveContext {
    chess: Chess;
    move: Move;
}

export interface VariantMoveQueryContext {
    chess: Chess;
    from?: string;
}

export interface VariantResolutionContext {
    chess: Chess;
}

export interface IChessVariant extends VariantMetadata {
    setupBoard(context: VariantSetupContext): void;
    getValidSpecialMoves?(context: VariantMoveQueryContext): Move[];
    getValidMoves(context: VariantMoveQueryContext): Move[];
    applyMove(context: VariantMoveContext): boolean;
    isGameOver?(context: VariantResolutionContext): boolean;
    getWinner?(context: VariantResolutionContext): "w" | "b" | null;
    createOrchestrator(): SpecialGameOrchestrator;
    cloneWithState(sourceChess: Chess, targetChess: Chess): IChessVariant;
}

export interface SpecialChessContext {
    chess: Chess;
    configuration: SpecialConfigurationNormal;
    variant: IChessVariant;
}

export interface MoveLifecycleContext extends SpecialChessContext {
    move: Move;
}

export interface AfterMoveChanges {
    timeMsAdded: number;
    fen?: string;
    turnsBeforeExtra?: number;
}

export interface UpgradeDetails {
    key: string;
    name: string;
    description?: string;
}

export type AfterMoveParams = {
    tcMinutes: number;
    tcBonus: number;
    extraTurn?: boolean;
    freeze?: string;
}

export interface ISpecialUpgrade {
    key: string;
    name: string;
    description?: string;
    clone(): ISpecialUpgrade;
    getUpgradeDetails(): UpgradeDetails;
    initialize?(context: SpecialChessContext): void;
    modifyValidMoves?(context: SpecialChessContext, moves: Move[], from?: string): Move[];
    beforeMove?(context: MoveLifecycleContext): Move | null;
    afterMove?(context: MoveLifecycleContext, moveApplied: boolean, params: AfterMoveParams): AfterMoveChanges;
    isGameOver?(context: SpecialChessContext): boolean | null;
    getWinner?(context: SpecialChessContext): "w" | "b" | null | undefined;
}

export interface SpecialGameOrchestrationContext {
    io: Server;
    specialGame: ActiveSpecialGame;
    gameEngines: Map<string, import("../IGameEngine").IGameEngine>;
    socketsByPlayerId: Map<string, import("../../sockets/socketHandlers").GameSocket>;
    specialGames: Map<string, ActiveSpecialGame>;
}

export interface SpecialGameGameCompletionContext extends SpecialGameOrchestrationContext {
    gameId: string;
    result: GameResult;
}

export interface SpecialGameOrchestrator {
    startSpecialGameRound(context: SpecialGameOrchestrationContext): Promise<void>;
    handleSpecialGameRoundCompletion(context: SpecialGameOrchestrationContext): Promise<void>;
    handleSpecialGameGameCompletion(context: SpecialGameGameCompletionContext): Promise<void>;
    finishSpecialGame(context: SpecialGameOrchestrationContext): Promise<void>;
}
