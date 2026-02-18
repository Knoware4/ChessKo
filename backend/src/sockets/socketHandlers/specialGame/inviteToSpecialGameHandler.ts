import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { InviteToSpecialGamePayload } from "../../socketPayloads";

// Not yet implemented
export async function inviteToSpecialGameHandler(io: Server, socket: GameSocket, payload: InviteToSpecialGamePayload) {
    const { playerId, specialGameId, inviterId } = payload;
    console.log("Player ", playerId, " is invited to special game: \n\nspecialGameId: ", specialGameId, "by the player ", inviterId);
}
