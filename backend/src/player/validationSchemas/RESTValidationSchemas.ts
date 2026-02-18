import z from 'zod';
import {
    UserRoleSchema,
    getMultipleModelsSchema,
    GameResultWinLoseDrawSchema,
} from '../../generalValidationSchemas';


const playerRequestSchema = z.object({
    nickname: z.string().min(3).max(255),
    email: z.string().email(),
    eloRankedBlitz: z.coerce.number().int().positive(),
    eloSpecialBlitz: z.coerce.number().int().positive(),
    eloRankedBullet: z.coerce.number().int().positive(),
    eloSpecialBullet: z.coerce.number().int().positive(),
    eloRankedRapid: z.coerce.number().int().positive(),
    eloSpecialRapid: z.coerce.number().int().positive(),
    eloRankedClassic: z.coerce.number().int().positive(),
    eloSpecialClassic: z.coerce.number().int().positive(),
    eloRankedUnlimited: z.coerce.number().int().positive(),
    eloSpecialUnlimited: z.coerce.number().int().positive(),
    role: UserRoleSchema,
    ongoingGameId: z.string().uuid().nullable().optional(),
    ongoingTournamentId: z.string().uuid().nullable().optional(),
    ongoingSpecialGameId: z.string().uuid().nullable().optional(),
});

const createNewPlayerRequestSchema = z.object({
    body: z.object({
        nickname: z.string().min(3).max(255),
        email: z.string().email(),
        eloRankedBlitz: z.coerce.number().int().positive().optional(),
        eloSpecialBlitz: z.coerce.number().int().positive().optional(),
        eloRankedBullet: z.coerce.number().int().positive().optional(),
        eloSpecialBullet: z.coerce.number().int().positive().optional(),
        eloRankedRapid: z.coerce.number().int().positive().optional(),
        eloSpecialRapid: z.coerce.number().int().positive().optional(),
        eloRankedClassic: z.coerce.number().int().positive().optional(),
        eloSpecialClassic: z.coerce.number().int().positive().optional(),
        eloRankedUnlimited: z.coerce.number().int().positive().optional(),
        eloSpecialUnlimited: z.coerce.number().int().positive().optional(),
        role: UserRoleSchema,
    }),
});

const getPlayerRequestSchema = z.object({
    params: z.object({
        playerId: z.string().uuid(),
    }),
});

const getPlayerByEmailRequestSchema = z.object({
    params: z.object({
        playerEmail: z.string().email(),
    }),
});

const patchPlayerRequestSchema
    = getPlayerRequestSchema.merge(z.object({
        body: playerRequestSchema.partial(),
    })
);

const deletePlayerRequestSchema = getPlayerRequestSchema

const getPlayerGamesRequestSchema
    = getPlayerRequestSchema.merge(z.object({
        query: z.object({
            result: GameResultWinLoseDrawSchema.optional(),
        }).merge(getMultipleModelsSchema.shape.query)
    })
);

const getPlayerTournamentsRequestSchema
    = getPlayerRequestSchema.merge(z.object({
        query: z.object({
        }).merge(getMultipleModelsSchema.shape.query)
    })
);

const getPlayerSpecialGamesRequestSchema
    = getPlayerRequestSchema.merge(z.object({
        query: z.object({
        }).merge(getMultipleModelsSchema.shape.query)
    })
);

const getPlayerSavedConfigurationsRequestSchema
    = getPlayerRequestSchema.merge(z.object({
        query: z.object({
        }).merge(getMultipleModelsSchema.shape.query)
    })
);


export {
    playerRequestSchema,
    createNewPlayerRequestSchema,
    getPlayerRequestSchema,
    getPlayerByEmailRequestSchema,
    patchPlayerRequestSchema,
    deletePlayerRequestSchema,
    getPlayerGamesRequestSchema,
    getPlayerTournamentsRequestSchema,
    getPlayerSpecialGamesRequestSchema,
    getPlayerSavedConfigurationsRequestSchema,
};
