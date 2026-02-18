import { Player } from "./player";
import { GameMode, GameResult, GameStatus, MatchType, TimeControl } from "./enums/enums";
import { SpecialConfigurationNormal } from "./specialConfigurationNormal";


export type Game = {
    id: string,
    gameMode: GameMode,
    matchType: MatchType,
    timeControl: TimeControl,
    tcMinutes: number,
    tcBonus: number,
    gameStatus: GameStatus,
    gameResult: GameResult | null,
    pgn: string,
    createdAt: Date,
    editedAt: Date,
    deletedAt: Date,
    startedAt: Date,
    finishedAt: Date,
    whitePlayer: Player,
    blackPlayer: Player,
    tournamentId: string | null,
    whiteEloBefore: number,
    blackEloBefore: number,
    tournamentRoundIndex?: number,
    specialGameId?: string,
    specialConfiguration?: SpecialConfigurationNormal,
};
