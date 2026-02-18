import { GameMode, MatchType } from "../enums/enums";


export interface CreateGameFormType {
    gameMode: GameMode | null,
    timeControl: {
        minutes: number,
        bonus: number,
    } | null,
    matchType: MatchType | null,
};
