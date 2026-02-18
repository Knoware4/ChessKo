import z from 'zod';


const socketIdentificationPayloadSchema = z.object({
    playerId: z.string().uuid(),
});

const saveConfigurationPayloadSchema = z.object({
    playerId: z.string().uuid(),
    specialConfigurationId: z.string().uuid(),
});


export {
    socketIdentificationPayloadSchema,
    saveConfigurationPayloadSchema,
};
