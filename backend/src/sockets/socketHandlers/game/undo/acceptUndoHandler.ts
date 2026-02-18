import { Server } from "socket.io";
import { GameSocket } from "../../../socketHandlers";
import { AcceptUndoPayload, UndoAcceptedPayload } from "../../../socketPayloads";
import { SocketEvent } from "../../../socketEvents";
import { parseSocketPayload } from "../../../socketValidation";
import { IGameEngine } from "../../../../engine/IGameEngine";
import { undoSocketPayloadSchema } from "../../../../game/validationSchemas/socketValidationSchemas";


export async function acceptUndoHandler(io: Server, socket: GameSocket, payload: AcceptUndoPayload, 
            gameEngines: Map<string, IGameEngine>) {
    const parsedPayload = await parseSocketPayload(socket, undoSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, gameId } = parsedPayload;
    console.log("Player ", playerId, " accepts a undo");

    const engine = gameEngines.get(gameId);
    if (!engine) {
        console.error("❌ No engine found for game", gameId);
        return;
    }
    const pgn = engine.undo();

    if (!pgn) {
        console.log("❌ Undo invalid");
        return;
    }

    const undoAcceptedPayload: UndoAcceptedPayload = {...parsedPayload, pgn };
    socket.to(gameId).emit(SocketEvent.UNDO_ACCEPTED, undoAcceptedPayload);
}
