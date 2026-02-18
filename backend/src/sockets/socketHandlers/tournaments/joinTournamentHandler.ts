import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, JoinTournamentPayload, TournamentJoinedPayload } from "../../socketPayloads";
import { SocketEvent } from "../../socketEvents";
import { GetTournamentPlayersData, PatchTournamentData, TournamentNormal } from "../../../tournament/types";
import { tournamentRepository } from "../../../tournament/repository/tournamentRepository";
import { PatchPlayerData } from "../../../player/types";
import { playerRepository } from "../../../player/repository/playerRepository";
import { parseSocketPayload } from "../../socketValidation";
import { joinTournamentSocketPayloadSchema } from "../../../tournament/validationSchemas/socketValidationSchemas";


export async function joinTournamentHandler(io: Server, socket: GameSocket, payload: JoinTournamentPayload) {
    if (socket.specialGameId) {
        console.error("Can not join a tournament while in special game");
        return;
    }
    const parsedPayload = await parseSocketPayload(socket, joinTournamentSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, tournamentId } = parsedPayload;
    console.log("Player ", playerId, " wants to join tournament: \n\ntournamentId: ", tournamentId);
            
    try {
        const getTournamentPlayersData: GetTournamentPlayersData = { pagesize: 32 };
        const tournament: TournamentNormal = (await tournamentRepository.getById(tournamentId)).unwrap();
        const tournamentPlayers = (await tournamentRepository.getTournamentPlayers(tournamentId, getTournamentPlayersData)).unwrap();
        if (tournamentPlayers.totalCount === 32) {
            console.error("❌ This tournament has reached its maximum capacity");
            return;
        }
        if (tournament.startedAt) {
            console.error("❌ Can not join a tournament that has already started");
            return;
        }

        const patchTournamentData: PatchTournamentData = {
            addPlayerIds: [ playerId ],
            numberOfPlayers: tournament.numberOfPlayers + 1,
        };
        await tournamentRepository.patch(tournamentId, patchTournamentData);

        const patchPlayerData: PatchPlayerData = {
            ongoingTournamentId: tournamentId,
        };
        await playerRepository.patch(playerId, patchPlayerData);

        const roomId = tournamentId;
        socket.join(roomId);
        socket.tournamentId = tournamentId;

        const tournamentJoinedPayload: TournamentJoinedPayload = parsedPayload;
        io.to(roomId).emit(SocketEvent.TOURNAMENT_JOINED, tournamentJoinedPayload);
    }
    catch (e) {
        console.error("Failed to process tournament action:", e);
        const errorPayload: ErrorPayload = {
            message: "Join tournament operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}
