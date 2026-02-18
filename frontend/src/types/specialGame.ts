import { MatchType, TimeControl } from "./enums/enums";
import { Game } from "./game";
import { Player } from "./player";


export interface SpecialGame {
    id: string,
    name: string,
    matchType: MatchType,
    timeControl: TimeControl,
    tcMinutes: number,
    tcBonus: number,
    createdAt: Date,
    editedAt: Date,
    deletedAt?: Date,
    startedAt?: Date,
    finishedAt?: Date,
    ownerId: string,
    owner: Player,
    winnerId?: string,
    winner?: Player,
    currentRoundIndex?: number,
    totalRounds?: number,
    numberOfPlayers: number,
    players?: Player[],
    games?: Game[],
    specialConfiguration: string,
    playerResultIndex?: number,
};
