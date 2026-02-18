import z from 'zod';
import {
    GameModeSchema, MatchTypeSchema,
    TimeControlSchema, GameStatusSchema,
    getMultipleModelsSchema,
    GameResultSchema,
    PlayerLessSchema,
} from '../../generalValidationSchemas';


const gameRequestSchema = z.object({
    gameMode: GameModeSchema,
    matchType: MatchTypeSchema,
    timeControl: TimeControlSchema,
    tcMinutes: z.coerce.number().int().min(1),
    tcBonus: z.coerce.number().int().min(0),
    gameStatus: GameStatusSchema,
    gameResult: GameResultSchema.optional(),
    whiteEloBefore: z.coerce.number().int().positive(),
    blackEloBefore: z.coerce.number().int().positive(),
    whiteEloAfter: z.coerce.number().int().positive().optional(),
    blackEloAfter: z.coerce.number().int().positive().optional(),
    pgn: z.string().nullable().optional(),
    whitePlayer: PlayerLessSchema,
    blackPlayer: PlayerLessSchema,
    startedAt: z.date().optional(),
    finishedAt: z.date().optional(),
    tournamentId: z.string().uuid().nullable().optional(),
});

const createNewGameRequestSchema = z.object({
    body: z.object({
        gameMode: GameModeSchema,
        matchType: MatchTypeSchema,
        tcMinutes: z.coerce.number().int().min(1),
        tcBonus: z.coerce.number().int().min(0),
        gameStatus: GameStatusSchema.optional(),
        pgn: z.string().nullable().optional(),
        player1Id: z.string().uuid(),
        player2Id: z.string().uuid(),
        whitePlayerId: z.string().uuid().optional(),
        blackPlayerId: z.string().uuid().optional(),
        tournamentId: z.string().uuid().optional(),
        tournamentRoundIndex: z.coerce.number().int().min(0).optional(),
        specialConfigurationId: z.string().uuid().optional(),
    }),
});

const getGameRequestSchema = z.object({
    params: z.object({
        gameId: z.string().uuid(),
    }),
});

const patchGameRequestSchema
    = getGameRequestSchema.merge(z.object({
        body: z.object({
            gameStatus: GameStatusSchema,
            gameMode: GameModeSchema,
            matchType: MatchTypeSchema,
            tcMinutes: z.coerce.number().int().min(1),
            tcBonus: z.coerce.number().int().min(0),
            gameResult: GameResultSchema,
            whiteEloAfter: z.coerce.number().int().positive(),
            blackEloAfter: z.coerce.number().int().positive(),
            pgn: z.string().nullable(),
            startedAt: z.date(),
            finishedAt: z.date(),
            tournamentId: z.string().uuid(),
            tournamentRoundIndex: z.coerce.number().int().min(0),
        }).partial(),
    }),
);

const deleteGameRequestSchema = getGameRequestSchema;

const getAllGamesRequestSchema
    = z.object({
        query: z.object({
            start: z.string().date().optional(),
            end: z.string().date().optional(),
            gameMode: GameModeSchema.optional(),
            matchType: MatchTypeSchema.optional(),
            timeControl: TimeControlSchema.optional(),
            tcMinutes: z.coerce.number().int().min(1).optional(),
            tcBonus: z.coerce.number().int().min(0).optional(),
            gameStatus: GameStatusSchema.optional(),
        }).merge(getMultipleModelsSchema.shape.query),
    },
);


export {
    gameRequestSchema,
    createNewGameRequestSchema,
    getGameRequestSchema,
    patchGameRequestSchema,
    deleteGameRequestSchema,
    getAllGamesRequestSchema,
};
