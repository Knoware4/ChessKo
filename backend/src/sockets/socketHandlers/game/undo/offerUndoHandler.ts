import { Server } from "socket.io";
import { GameSocket } from "../../../socketHandlers";
import { InvalidUndoPayload, OfferUndoPayload, UndoOfferedPayload } from "../../../socketPayloads";
import { SocketEvent } from "../../../socketEvents";
import { parseSocketPayload } from "../../../socketValidation";
import { IGameEngine } from "../../../../engine/IGameEngine";
import { undoSocketPayloadSchema } from "../../../../game/validationSchemas/socketValidationSchemas";


export async function offerUndoHandler(io: Server, socket: GameSocket, payload: OfferUndoPayload, 
            gameEngines: Map<string, IGameEngine>) {
    const parsedPayload = await parseSocketPayload(socket, undoSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, gameId } = parsedPayload;
    console.log("Player ", playerId, " offers a undo");

    const engine = gameEngines.get(gameId);
    if (!engine) {
        console.error("❌ No engine found for game", gameId);
        return;
    }

    if (!engine.canUndo()) {
        console.log("❌ There is no move to undo!", gameId);
        const invalidUndoPayload: InvalidUndoPayload = parsedPayload;
        socket.emit(SocketEvent.INVALID_UNDO, invalidUndoPayload);
    }

    const undoOfferedPayload: UndoOfferedPayload = parsedPayload;
    socket.to(gameId).emit(SocketEvent.UNDO_OFFERED, undoOfferedPayload);
}
