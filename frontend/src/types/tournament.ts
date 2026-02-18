import { GameMode, TimeControl } from "./enums/enums";
import { Game } from "./game";
import { Player } from "./player";


export interface Tournament {
    id: string,
    name: string,
    gameMode: GameMode,
    timeControl: TimeControl,
    tcMinutes: number,
    tcBonus: number,
    createdAt: Date,
    editedAt: Date,
    deletedAt: Date,
    startedAt: Date | undefined,
    finishedAt: Date | undefined,
    players: Player[],
    games: Game[],
    owner: Player,
    winner: Player
    numberOfPlayers: number,
    currentRoundIndex: number,
    playerResultIndex?: number,
    specialConfiguration?: string
};
