import z from 'zod';
import {
    getMultipleModelsSchema,
    TimeControlSchema,
    PlayerNormalSchema,
} from '../../generalValidationSchemas';


const tournamentRequestSchema = z.object({
    name: z.string().min(3).max(255),
    timeControl: TimeControlSchema,
    tcMinutes: z.coerce.number().int().min(1),
    tcBonus: z.coerce.number().int().min(0),
    owner: PlayerNormalSchema,
    winner: PlayerNormalSchema.nullable().optional(),
    startedAt: z.coerce.date().nullable().optional(),
    finishedAt: z.coerce.date().nullable().optional(),
    currentRoundIndex: z.coerce.number().int().min(0),
    totalRounds: z.coerce.number().int().min(3),
    numberOfPlayers: z.coerce.number().int().min(1),
    specialConfiguration: z.string().optional(),
});

const tournamentResultRequestSchema = z.object({
    id: z.string().uuid(),
    player: PlayerNormalSchema,
    resultIndex: z.coerce.number().int().min(0),
    roundIndex: z.coerce.number().int().min(0),
    score: z.coerce.number().min(0),
});

const createNewTournamentRequestSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(255),
        tcMinutes: z.coerce.number().int().min(1),
        tcBonus: z.coerce.number().int().min(0),
        totalRounds: z.coerce.number().int().min(3).optional(),
        ownerId: z.string().uuid(),
        playerIds: z.array(z.string().uuid()),
        specialConfiguration: z.string().optional(),
    })
});

const getTournamentRequestSchema = z.object({
    params: z.object({
        tournamentId: z.string().uuid(),
    }),
});

const patchTournamentRequestSchema
    = getTournamentRequestSchema.merge(z.object({
        body: tournamentRequestSchema.partial().merge(z.object({
            addPlayerIds: z.array(z.string().uuid()),
            removePlayerIds: z.array(z.string().uuid()),
            gameIds: z.array(z.string().uuid()),
            ownerId: z.string().uuid(),
            winnerId: z.string().uuid(),
        }).partial()),
    })
);

const deleteTournamentRequestSchema = getTournamentRequestSchema;

const getAllTournamentsRequestSchema
    = z.object({
        query: z.object({
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

const getTournamentGamesRequestSchema
    = getTournamentRequestSchema.merge(z.object({
        query: z.object({
            tournamentRoundIndex: z.coerce.number().int().min(0).optional(),
        }).merge(getMultipleModelsSchema.shape.query)
    })
);

const getTournamentLeaderboardRequestSchema = z.object({
    params: getTournamentRequestSchema.shape.params,
    query: getMultipleModelsSchema.shape.query.extend({
        tournamentRoundIndex: z.coerce.number().int().min(0),
    }),
});

const getTournamentPlayersRequestSchema
    = getTournamentRequestSchema.merge(z.object({
        query: z.object({
        }).merge(getMultipleModelsSchema.shape.query)
    })
);

export {
    tournamentRequestSchema,
    createNewTournamentRequestSchema,
    getTournamentRequestSchema,
    patchTournamentRequestSchema,
    deleteTournamentRequestSchema,
    getTournamentGamesRequestSchema,
    getAllTournamentsRequestSchema,
    getTournamentPlayersRequestSchema,
    tournamentResultRequestSchema,
    getTournamentLeaderboardRequestSchema,
};
