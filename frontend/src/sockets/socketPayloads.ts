import { Color, GameMode, MatchType, UpgradeKey } from "../types/enums/enums";

export type SocketIdentificationPayload = {
    playerId: string;
};

export type ErrorPayload = {
    message: string;
}

export type SearchGamePayload = {
    socketId: string;
    playerId: string;
    gameMode: GameMode;
    matchType: MatchType;
    tcMinutes: number;
    tcBonus: number;
};

export type CreateSpecialGamePayload = {
    playerId: string;
    name: string;
    matchType: MatchType;
    tcMinutes: number;
    tcBonus: number;
    specialConfigurationId?: string | null;
    specialConfiguration?: string;
};

export type SpecialGameCreatedPayload = CreateSpecialGamePayload & {
    specialGameId: string;
};

export type JoinSpecialGamePayload = {
    playerId: string;
    specialGameId: string;
};

export type SpecialGameJoinedPayload = JoinSpecialGamePayload;

export type InviteToSpecialGamePayload = JoinSpecialGamePayload & {
    inviterId: string;
};

export type InvitedToSpecialGamePayload = InviteToSpecialGamePayload;

export type StartSpecialGamePayload = JoinSpecialGamePayload;

export type SpecialGameStartedPayload = {
    specialGameId: string;
};

export type SpecialGameGameStartedPayload = {
    specialGameId: string;
    gameId: string;
};

export type SpecialGamePairingPayload = {
    matchId: string;
    whitePlayerId: string | null;
    blackPlayerId: string | null;
    isBye: boolean;
};

export type SpecialGamePlayerByePayload = {
    specialGameId: string;
    roundNumber: number;
    playerId: string;
}

export type SpecialGameRoundStartedPayload = {
    specialGameId: string;
    roundNumber: number;
    pairings: SpecialGamePairingPayload[];
};

export type SpecialGameLeaderboardEntry = {
    playerId: string;
    score: number;
    elo: number;
    colorHistory: Color[];
    hasBye: boolean;
};

export type SpecialGameFinishedPayload = {
    specialGameId: string;
    winnerId: string;
    leaderboard: SpecialGameLeaderboardEntry[];
};

export type LeaveSpecialGamePayload = JoinSpecialGamePayload;

export type LeftSpecialGamePayload = JoinSpecialGamePayload;

export type KickFromSpecialGamePayload = {
    kickerId: string;
    playerId: string;
    specialGameId: string;
};

export type KickedFromSpecialGamePayload = JoinSpecialGamePayload;

export type SpecialGameCanceledPayload = {
    specialGameId: string;
};

export type LoadOngoingGamePayload = {
    playerId: string;
    gameId: string;
};

export type OngoingGameLoadedPayload = {
    playerId: string;
    gameId: string;
    fen: string;
    whiteTime: number;
    blackTime: number;
    turnColor: "w" | "b";
    validSpecialMovesWithAfterFens?: ValidSpecialMoveWithAfterFen[];
    turnsBeforeExtra?: { w: number; b: number };
    remainingPawnDashes?: { w: number; b: number };
}

export type NoOngoingGamePayload = {
    playerId: string;
}

export type StopSearchingPayload = {
    socketId: string;
    playerId: string;
};

export type GameFoundPayload = {
    gameId: string;
};

export type OfferDrawPayload = {
    playerId: string;
    gameId: string;
};
export type DrawOfferedPayload = OfferDrawPayload;

export type AcceptDrawPayload = OfferDrawPayload;
export type DrawAcceptedPayload = {
    gameId: string;
};

export type DeclineDrawPayload = OfferDrawPayload;
export type DrawDeclinedPayload = OfferDrawPayload;

export type ResignPayload = OfferDrawPayload;
export type ResignedPayload = {
    gameId: string;
    winnerId: string;
    loserId: string;
}

export type AcceptUndoPayload = OfferDrawPayload;
export type UndoAcceptedPayload = {
    playerId: string;
    gameId: string;
    pgn: string;
};

export type CreateTournamentPayload = {
    playerId: string;
    name: string;
    tcMinutes: number;
    tcBonus: number;
    specialConfiguration?: string;
};
export type TournamentCreatedPayload = CreateTournamentPayload & {
    tournamentId: string;
};

export type TournamentCanceledPayload = {
    tournamentId: string;
};

export type TournamentLeaderboardEntry = {
    playerId: string;
    score: number;
    buchholz: number;
    medianBuchholz: number;
    elo: number;
    colorHistory: Color[];
    hasBye: boolean;
};

export type TournamentFinishedPayload = {
    tournamentId: string;
    winnerId: string;
    leaderboard: TournamentLeaderboardEntry[];
};

export type JoinTournamentPayload = {
    playerId: string;
    tournamentId: string;
};
export type TournamentJoinedPayload = JoinTournamentPayload;

export type StartTournamentPayload = JoinTournamentPayload;
export type TournamentStartedPayload = {
    tournamentId: string;
};

export type TournamentPairingPayload = {
    matchId: string;
    whitePlayerId: string | null;
    blackPlayerId: string | null;
    isBye: boolean;
};

export type TournamentRoundStartedPayload = {
    tournamentId: string;
    roundNumber: number;
    pairings: TournamentPairingPayload[];
};

export type TournamentPlayerByePayload = {
    tournamentId: string;
    roundNumber: number;
    playerId: string;
};

export type KickFromTournamentPayload = {
    kickerId: string;
    playerId: string;
    tournamentId: string;
};
export type KickedFromTournamentPayload = JoinTournamentPayload;

export type LeaveTournamentPayload = JoinTournamentPayload;
export type LeftTournamentPayload = JoinTournamentPayload;

export type InviteToTournamentPayload = JoinTournamentPayload & {
    inviterId: string;
};
export type InvitedToTournamentPayload = InviteToTournamentPayload;

export type TournamentGameStartedPayload = {
    tournamentId: string;
    gameId: string;
};

export type OfferUndoPayload = OfferDrawPayload;
export type UndoOfferedPayload = OfferDrawPayload;

export type DeclineUndoPayload = OfferDrawPayload;
export type UndoDeclinedPayload = OfferDrawPayload;

export type InvalidUndoPayload = OfferDrawPayload;
export type TimeoutPayload = {
    gameId: string;
    winnerId: string;
    loserId: string;
}

export type FreezePayload = {
    playerId: string;
    gameId: string;
    square: string;
};

export type MovePayload = {
    playerId: string;
    from: string;
    to: string;
    promotion: "q" | "r" | "b" | "n" | undefined;
    gameId: string;
    special?: UpgradeKey;
    useExtraTurn?: boolean;
};

export type ValidSpecialMoveWithAfterFen = {
    from: string;
    to: string;
    special?: UpgradeKey;
    afterFen: string;
};

export type ValidMovePayload = MovePayload & {
    winnerId: string | undefined;
    whiteTime: number;
    blackTime: number;
    extraMoveFen: string | undefined;
    validSpecialMovesWithAfterFens?: ValidSpecialMoveWithAfterFen[];
    turnsBeforeExtra?: { w: number; b: number };
    remainingPawnDashes?: { w: number; b: number };
};

export type InvalidMovePayload = {
    playerId: string;
    gameId: string;
};

export type SendMessagePayload = {
    playerId: string;
    roomId: string;
    message: string;
};

export type ReceiveMessagePayload = {
    playerId: string;
    roomId: string;
    message: string;
};

export type SaveConfigurationPayload = {
    playerId: string,
    specialConfigurationId: string
};
