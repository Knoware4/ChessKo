import type { BaseModelTimestamps } from '../types';
import { z } from "zod";
import {
    createNewPlayerRequestSchema,
    patchPlayerRequestSchema,
    getPlayerGamesRequestSchema,
    playerRequestSchema,
    getPlayerTournamentsRequestSchema,
    getPlayerSavedConfigurationsRequestSchema,
    getPlayerSpecialGamesRequestSchema,
} from "./validationSchemas/RESTValidationSchemas";


type ObjectWithPlayerIdOnly = {
    id: string,
};

type NewPlayerData = z.infer<typeof createNewPlayerRequestSchema.shape.body>;

type PatchPlayerData = z.infer<typeof patchPlayerRequestSchema.shape.body>;

type GetPlayerGamesData = z.infer<typeof getPlayerGamesRequestSchema.shape.query>;

type GetPlayerTournamentsData = z.infer<typeof getPlayerTournamentsRequestSchema.shape.query>;

type GetPlayerSpecialGamesData = z.infer<typeof getPlayerSpecialGamesRequestSchema.shape.query>;

type GetPlayerSavedConfigurationsData = z.infer<typeof getPlayerSavedConfigurationsRequestSchema.shape.query>;

type PlayerNormal = ObjectWithPlayerIdOnly & 
                z.infer<typeof playerRequestSchema> &
                BaseModelTimestamps;

type PlayerStats = {
    victoryCount: number,
    lossCount: number,
    drawCount: number,
};

type PlayerLess = {
    nickname: string,
    eloRankedBlitz: number;
    eloSpecialBlitz: number;
    eloRankedBullet: number;
    eloSpecialBullet: number;
    eloRankedRapid: number;
    eloSpecialRapid: number;
    eloRankedClassic: number;
    eloSpecialClassic: number;
    eloRankedUnlimited: number;
    eloSpecialUnlimited: number;
}

type PlayerExtended = PlayerNormal & {
    gameStats: PlayerStats,
};


export {
    NewPlayerData,
    PatchPlayerData,
    GetPlayerGamesData,
    GetPlayerTournamentsData,
    GetPlayerSpecialGamesData,
    GetPlayerSavedConfigurationsData,
    PlayerStats,
    PlayerNormal,
    PlayerExtended,
    PlayerLess,
}
