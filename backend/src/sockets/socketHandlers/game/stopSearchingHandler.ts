import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { StopSearchingPayload } from "../../socketPayloads";
import { parseSocketPayload } from "../../socketValidation";
import { stopSearchingSocketPayloadSchema } from "../../../game/validationSchemas/socketValidationSchemas";
import { removeFromQueueBySocket } from "../../../matchmaking";


export async function stopSearchingHandler(io: Server, socket: GameSocket, payload: StopSearchingPayload) {
    const parsedPayload = await parseSocketPayload(socket, stopSearchingSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId } = parsedPayload;
    console.log("Player ", playerId, " leaves the game queue");
    
    const removed = removeFromQueueBySocket(socket.id);
    if (removed) {
        console.log(`❌ Player ${removed.playerId} left the queue`);
    }
}
