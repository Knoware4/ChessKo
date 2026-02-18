import z from 'zod';
import { createNewSpecialGameRequestSchema } from './RESTValidationSchemas';


const createSpecialGameSocketPayloadSchema = createNewSpecialGameRequestSchema.shape.body.pick({
    name: true,
    matchType: true,
    tcMinutes: true,
    tcBonus: true,
    totalRounds: true,
    specialConfiguration: true,
}).extend({
    playerId: z.string().uuid(),
});

const joinSpecialGameSocketPayloadSchema = z.object({
    playerId: z.string().uuid(),
    specialGameId: z.string().uuid(),
});

const leaveSpecialGameSocketPayloadSchema = joinSpecialGameSocketPayloadSchema;

const startSpecialGameSocketPayloadSchema = joinSpecialGameSocketPayloadSchema;

const kickFromSpecialGameSocketPayloadSchema = z.object({
    kickerId: z.string().uuid(),
    playerId: z.string().uuid(),
    specialGameId: z.string().uuid(),
});


export {
    createSpecialGameSocketPayloadSchema,
    joinSpecialGameSocketPayloadSchema,
    leaveSpecialGameSocketPayloadSchema,
    startSpecialGameSocketPayloadSchema,
    kickFromSpecialGameSocketPayloadSchema,
};
