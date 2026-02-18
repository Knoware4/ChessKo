import z, { nativeEnum } from 'zod';
import {
    getMultipleModelsSchema,
    TimeControlSchema,
    PlayerNormalSchema,
    MatchTypeSchema,
} from '../../generalValidationSchemas';
import { UpgradeKey, VariantKey } from '@prisma/client';


const specialGameRequestSchema = z.object({
    name: z.string().min(3).max(255),
    timeControl: TimeControlSchema,
    matchType: MatchTypeSchema,
    tcMinutes: z.coerce.number().int().min(1),
    tcBonus: z.coerce.number().int().min(0),
    owner: PlayerNormalSchema,
    winner: PlayerNormalSchema.nullable().optional(),
    startedAt: z.coerce.date().nullable().optional(),
    finishedAt: z.coerce.date().nullable().optional(),
    currentRoundIndex: z.coerce.number().int().min(0).optional(),
    totalRounds: z.coerce.number().int().min(1).optional(),
    numberOfPlayers: z.coerce.number().int().min(1),
});

const createNewSpecialGameRequestSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(255),
        tcMinutes: z.coerce.number().int().min(1),
        tcBonus: z.coerce.number().int().min(0),
        matchType: MatchTypeSchema,
        totalRounds: z.coerce.number().int().min(1).optional(),
        ownerId: z.string().uuid(),
        playerIds: z.array(z.string().uuid()),
        specialConfigurationId: z.string().uuid().optional(),
        specialConfiguration: z.string(),
    })
});

const createNewSpecialConfigurationRequestSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(255),
        variantKey: z.nativeEnum(VariantKey),
        upgradeKeys: z.array(nativeEnum(UpgradeKey)),
    }),
});

const getSpecialGameRequestSchema = z.object({
    params: z.object({
        specialGameId: z.string().uuid(),
    }),
});

const patchSpecialGameRequestSchema
    = getSpecialGameRequestSchema.merge(z.object({
        body: specialGameRequestSchema.partial().merge(z.object({
            addPlayerIds: z.array(z.string().uuid()),
            removePlayerIds: z.array(z.string().uuid()),
            gameIds: z.array(z.string().uuid()),
            ownerId: z.string().uuid(),
            winnerId: z.string().uuid(),
        }).partial()),
    })
);

const deleteSpecialGameRequestSchema = getSpecialGameRequestSchema;

const getAllSpecialGamesRequestSchema
    = z.object({
        query: z.object({
            matchType: MatchTypeSchema.optional(),
            timeControl: TimeControlSchema.optional(),
            tcMinutes: z.coerce.number().int().min(1).optional(),
            tcBonus: z.coerce.number().int().min(0).optional(),
            isAvailable: z.preprocess((val) => {
                if (val === 'true' || val === true) return true;
                if (val === 'false' || val === false) return false;
                return undefined;
            }, z.boolean().optional()),
        }).merge(getMultipleModelsSchema.shape.query)
    }
);

const getSpecialGameGamesRequestSchema
    = getSpecialGameRequestSchema.merge(z.object({
        query: z.object({
            specialGameRoundIndex: z.coerce.number().int().min(0).optional(),
        }).merge(getMultipleModelsSchema.shape.query)
    })
);

const getSpecialGamePlayersRequestSchema
    = getSpecialGameRequestSchema.merge(z.object({
        query: z.object({
        }).merge(getMultipleModelsSchema.shape.query)
    })
);

const specialGameResultRequestSchema = z.object({
    id: z.string().uuid(),
    player: PlayerNormalSchema,
    specialGame: specialGameRequestSchema,
    resultIndex: z.coerce.number().int().min(0),
    roundIndex: z.coerce.number().int().min(0),
    score: z.coerce.number().min(0).optional(),
});

const getSpecialGameLeaderboardRequestSchema = z.object({
    params: getSpecialGameRequestSchema.shape.params,
    query: getMultipleModelsSchema.shape.query.extend({
        specialGameRoundIndex: z.coerce.number().int().min(0),
    }),
});


export {
    specialGameRequestSchema,
    createNewSpecialGameRequestSchema,
    getSpecialGameRequestSchema,
    patchSpecialGameRequestSchema,
    deleteSpecialGameRequestSchema,
    getSpecialGameGamesRequestSchema,
    getAllSpecialGamesRequestSchema,
    getSpecialGamePlayersRequestSchema,
    specialGameResultRequestSchema,
    getSpecialGameLeaderboardRequestSchema,
    createNewSpecialConfigurationRequestSchema,
};
