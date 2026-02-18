import z from 'zod';
import { GameModeSchema, MatchTypeSchema } from '../../generalValidationSchemas';
import { UpgradeKey } from '@prisma/client';


const searchGameSocketPayloadSchema = z.object({
    socketId: z.string().min(1),
    playerId: z.string().uuid(),
    gameMode: GameModeSchema,
    matchType: MatchTypeSchema,
    tcMinutes: z.coerce.number().int().min(1),
    tcBonus: z.coerce.number().int().min(0),
});

const createSpecialGameSocketPayloadSchema = z.object({
    playerId: z.string().uuid(),
    name: z.string().min(3).max(255),
    matchType: MatchTypeSchema,
    tcMinutes: z.coerce.number().int().min(1),
    tcBonus: z.coerce.number().int().min(0),
    specialConfigurationId: z.string().uuid().optional(),
    specialConfiguration: z.string(),
});

const joinSpecialGameSocketPayloadSchema = z.object({
    playerId: z.string().uuid(),
    specialGameId: z.string().uuid(),
});

const startSpecialGameSocketPayloadSchema = joinSpecialGameSocketPayloadSchema;

const gamePlayerSocketPayloadSchema = z.object({
    playerId: z.string().uuid(),
    gameId: z.string().uuid(),
});

const loadOngoingGameSocketPayloadSchema = gamePlayerSocketPayloadSchema;

const stopSearchingSocketPayloadSchema = z.object({
    socketId: z.string().min(1),
    playerId: z.string().uuid(),
});

const moveSocketPayloadSchema = z.object({
    playerId: z.string().uuid(),
    from: z.string().toLowerCase().regex(/^[a-h][1-8]$/),
    to: z.string().toLowerCase().regex(/^[a-h][1-8]$/),
    promotion: z.enum(["q", "r", "b", "n"]).optional(),
    special: z.nativeEnum(UpgradeKey).optional(),
    handledByUpgrade: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
    gameId: z.string().uuid(),
    useExtraTurn: z.boolean().optional(),
});

const resignSocketPayloadSchema = gamePlayerSocketPayloadSchema;

const drawSocketPayloadSchema = gamePlayerSocketPayloadSchema;

const undoSocketPayloadSchema = gamePlayerSocketPayloadSchema;

const timeoutSocketPayloadSchema = z.object({
    gameId: z.string().uuid(),
    winnerId: z.string().uuid(),
    loserId: z.string().uuid(),
});


export {
    searchGameSocketPayloadSchema,
    loadOngoingGameSocketPayloadSchema,
    stopSearchingSocketPayloadSchema,
    moveSocketPayloadSchema,
    resignSocketPayloadSchema,
    drawSocketPayloadSchema,
    undoSocketPayloadSchema,
    timeoutSocketPayloadSchema,
    createSpecialGameSocketPayloadSchema,
    joinSpecialGameSocketPayloadSchema,
    startSpecialGameSocketPayloadSchema,
};
