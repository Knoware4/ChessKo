import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { InviteToTournamentPayload } from "../../socketPayloads";

// Not yet implemented
export async function inviteToTournamentHandler(io: Server, socket: GameSocket, payload: InviteToTournamentPayload) {
    const { playerId, tournamentId, inviterId } = payload;
    console.log("Player ", playerId, " is invited to tournament: \n\ntournamentId: ", tournamentId, "by the player ", inviterId);
}
