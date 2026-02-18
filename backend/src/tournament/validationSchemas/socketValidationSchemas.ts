import z from 'zod';
import { createNewTournamentRequestSchema } from './RESTValidationSchemas';


const createTournamentSocketPayloadSchema = createNewTournamentRequestSchema.shape.body.pick({
    name: true,
    tcMinutes: true,
    tcBonus: true,
    specialConfiguration: true,
}).extend({
    playerId: z.string().uuid(),
});

const joinTournamentSocketPayloadSchema = z.object({
    playerId: z.string().uuid(),
    tournamentId: z.string().uuid(),
});

const leaveTournamentSocketPayloadSchema = joinTournamentSocketPayloadSchema;

const startTournamentSocketPayloadSchema = joinTournamentSocketPayloadSchema;

const kickFromTournamentSocketPayloadSchema = z.object({
    kickerId: z.string().uuid(),
    playerId: z.string().uuid(),
    tournamentId: z.string().uuid(),
});


export {
    createTournamentSocketPayloadSchema,
    joinTournamentSocketPayloadSchema,
    leaveTournamentSocketPayloadSchema,
    startTournamentSocketPayloadSchema,
    kickFromTournamentSocketPayloadSchema,
};
