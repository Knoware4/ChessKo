import type { BaseModelTimestamps } from '../types';
import { z } from "zod";
import {
    createNewSpecialGameRequestSchema,
    patchSpecialGameRequestSchema,
    getSpecialGameGamesRequestSchema,
    getAllSpecialGamesRequestSchema,
    specialGameRequestSchema,
    getSpecialGamePlayersRequestSchema,
    createNewSpecialConfigurationRequestSchema,
    specialGameResultRequestSchema,
    getSpecialGameLeaderboardRequestSchema,
} from "./validationSchemas/RESTValidationSchemas";


type ObjectWithIdOnly = {
    id: string,
};

type NewSpecialGameData = z.infer<typeof createNewSpecialGameRequestSchema.shape.body>;

type PatchSpecialGameData = z.infer<typeof patchSpecialGameRequestSchema.shape.body>;

type GetSpecialGameGamesData = z.infer<typeof getSpecialGameGamesRequestSchema.shape.query>;

type GetSpecialGamePlayersData = z.infer<typeof getSpecialGamePlayersRequestSchema.shape.query>;

type GetAllSpecialGamesData = z.infer<typeof getAllSpecialGamesRequestSchema.shape.query>;

type SpecialGameNormal = ObjectWithIdOnly & 
                z.infer<typeof specialGameRequestSchema> &
                {
                    specialConfiguration: SpecialConfigurationNormal;
                } &
                BaseModelTimestamps;

type SpecialConfigurationNormal = ObjectWithIdOnly &
                  z.infer<typeof createNewSpecialConfigurationRequestSchema.shape.body>;

type GetSpecialGameLeaderboardData = z.infer<typeof getSpecialGameLeaderboardRequestSchema.shape.query>;

type SpecialGameResult = z.infer<typeof specialGameResultRequestSchema> &
                    { createdAt: Date; };

type PlayerSpecialGameWithResult = SpecialGameNormal & {
    playerResultIndex: number;
};


export {
    NewSpecialGameData,
    PatchSpecialGameData,
    GetSpecialGameGamesData,
    GetSpecialGamePlayersData,
    SpecialGameNormal,
    GetAllSpecialGamesData,
    SpecialGameResult,
    PlayerSpecialGameWithResult,
    GetSpecialGameLeaderboardData,
    SpecialConfigurationNormal,
};
