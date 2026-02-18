import { Color, GameResult, TimeControl } from "@prisma/client";


export interface TournamentPlayer {
    id: string;
    elo: number;
    seed: number;
};

export interface PlayerStanding {
    playerId: string;
    score: number;
    buchholz: number;
    colorHistory: Color[];
    lastColor: Color | null;
    whiteCount: number;
    blackCount: number;
    hasBye: boolean;
    opponents: Set<string>;
};

export interface TournamentMatch {
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

export interface TournamentRound {
    id: string;
    roundNumber: number;
    matches: TournamentMatch[];
    isComplete: boolean;
};

export interface ActiveTournament {
    id: string;
    players: TournamentPlayer[];
    standings: Map<string, PlayerStanding>;
    rounds: TournamentRound[];
    currentRoundIndex: number;
    totalRounds: number;
    isFinished: boolean;
    timeControl: TimeControl;
    tcMinutes: number;
    tcBonus: number;
    matchesByGameId: Map<string, { roundIndex: number; matchId: string }>;
};

export interface TournamentLeaderboardDbEntry {
    playerId: string,
    roundIndex: number,
    score: number,
};
