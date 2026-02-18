import { Server } from "socket.io";
import { GameSocket } from "../socketHandlers";
import { removeFromQueueBySocket } from "../../matchmaking";


export function disconnectHandler(io: Server, socket: GameSocket, socketsById: Map<string, GameSocket>, 
            socketsByPlayerId: Map<string, GameSocket>) {
    console.log("❌ Player disconnected:", socket.id);

    socketsById.delete(socket.id);
    if (socket.playerId) {
        socketsByPlayerId.delete(socket.playerId);
    }
    removeFromQueueBySocket(socket.id);
}
