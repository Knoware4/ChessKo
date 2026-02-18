import z from 'zod';
import {
    Role, GameResult,
    GameMode, MatchType,
    TimeControl, GameStatus,
    Color,
 } from "@prisma/client";


const UserRoleSchema = z.string().toUpperCase().pipe(z.nativeEnum(Role));

const GameResultSchema = z.string().toUpperCase().pipe(z.nativeEnum(GameResult));

const GameResultWinLoseDrawSchema = z.enum(["WIN", "LOSE", "DRAW"]);

const GameModeSchema = z.string().toUpperCase().pipe(z.nativeEnum(GameMode));

const MatchTypeSchema = z.string().toUpperCase().pipe(z.nativeEnum(MatchType));

const TimeControlSchema = z.string().toUpperCase().pipe(z.nativeEnum(TimeControl));

const GameStatusSchema = z.string().toUpperCase().pipe(z.nativeEnum(GameStatus));

const ColorSchema = z.string().toUpperCase().pipe(z.nativeEnum(Color));

const PlayerNormalSchema = z.object({
    id: z.string().uuid(),
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
    createdAt: z.date(),
    editedAt: z.date(),
    deletedAt: z.date().nullable().optional(),
    ongoingGameId: z.string().uuid().nullable().optional(),
    ongoingTournamentId: z.string().uuid().nullable().optional(),
})

const PlayerLessSchema = z.object({
    id: z.string().uuid(),
    nickname: z.string().min(3).max(255),
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
    createdAt: z.date(),
    editedAt: z.date(),
    deletedAt: z.date().nullable().optional(),
    ongoingGameId: z.string().uuid().nullable().optional(),
    ongoingTournamentId: z.string().uuid().nullable().optional(),
})

const getMultipleModelsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        pagesize: z.coerce.number().int().positive().max(1000).default(10),
        keyword: z.string().optional(),
    }),
});


export {
    UserRoleSchema,
    GameResultSchema,
    GameResultWinLoseDrawSchema,
    getMultipleModelsSchema,
    GameModeSchema,
    MatchTypeSchema,
    TimeControlSchema,
    GameStatusSchema,
    ColorSchema,
    PlayerNormalSchema,
    PlayerLessSchema,
};
