import { Server } from "socket.io";
import { GameSocket } from "../../../socketHandlers";
import { DeclineUndoPayload, UndoDeclinedPayload } from "../../../socketPayloads";
import { SocketEvent } from "../../../socketEvents";
import { parseSocketPayload } from "../../../socketValidation";
import { undoSocketPayloadSchema } from "../../../../game/validationSchemas/socketValidationSchemas";


export async function declineUndoHandler(io: Server, socket: GameSocket, payload: DeclineUndoPayload) {
    const parsedPayload = await parseSocketPayload(socket, undoSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, gameId } = parsedPayload;
    console.log("Player ", playerId, " declines a undo");

    const undoDeclinedPayload: UndoDeclinedPayload = parsedPayload;
    socket.to(gameId).emit(SocketEvent.UNDO_DECLINED, undoDeclinedPayload);
}
