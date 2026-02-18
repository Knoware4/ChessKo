import type { BaseModelTimestamps } from '../types';
import { z } from "zod";
import {
    createNewGameRequestSchema,
    patchGameRequestSchema,
    gameRequestSchema,
    getAllGamesRequestSchema,
} from "./validationSchemas/RESTValidationSchemas";
import { SpecialConfigurationNormal } from '../specialGame/types';


type ObjectWithGameIdOnly = {
    id: string,
};

type NewGameData = z.infer<typeof createNewGameRequestSchema.shape.body>;

type PatchGameData = z.infer<typeof patchGameRequestSchema.shape.body>;

type GameNormal = ObjectWithGameIdOnly & 
                z.infer<typeof gameRequestSchema> &
                {
                    specialConfiguration: SpecialConfigurationNormal;
                } &
                BaseModelTimestamps;

type GetAllGamesData = z.infer<typeof getAllGamesRequestSchema.shape.query>;


export {
    NewGameData,
    PatchGameData,
    GameNormal,
    GetAllGamesData,
}
