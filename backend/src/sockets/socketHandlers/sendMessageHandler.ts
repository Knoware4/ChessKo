import { Server } from "socket.io";
import { GameSocket } from "../socketHandlers";
import { ReceiveMessagePayload, SendMessagePayload } from "../socketPayloads";
import { SocketEvent } from "../socketEvents";

// Not yet implemented
export function sendMessageHandler(io: Server, socket: GameSocket, payload: SendMessagePayload) {
    const { playerId, roomId, message } = payload;
    console.log("Player ", playerId, "  sends a message to room: ", roomId, "\n\nMessage: ", message);

    const receiveMessagePayload: ReceiveMessagePayload = payload;
    io.to(roomId).emit(SocketEvent.RECEIVE_MESSAGE, receiveMessagePayload);
}
