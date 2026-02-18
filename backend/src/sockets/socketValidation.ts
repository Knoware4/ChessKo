import type { ZodSchema, ZodTypeDef } from "zod";
import { fromZodError } from "zod-validation-error";
import { SocketEvent } from "./socketEvents";
import type { ErrorPayload } from "./socketPayloads";
import { GameSocket } from "./socketHandlers";


export const parseSocketPayload = async <Output, Def extends ZodTypeDef = ZodTypeDef, Input = Output>(
        socket: GameSocket, schema: ZodSchema<Output, Def, Input>, payload: unknown): Promise<Output | null> => {
    const parsedPayload = await schema.safeParseAsync(payload);

    if (!parsedPayload.success) {
        const error = fromZodError(parsedPayload.error);
        const errorPayload: ErrorPayload = {
            message: error.message,
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        console.error("Failed to parse socket payload");
        return null;
    }

    return parsedPayload.data;
};
