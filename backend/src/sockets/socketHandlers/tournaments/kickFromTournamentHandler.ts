import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, KickFromTournamentPayload, KickedFromTournamentPayload } from "../../socketPayloads";
import { SocketEvent } from "../../socketEvents";
import { PatchTournamentData } from "../../../tournament/types";
import { tournamentRepository } from "../../../tournament/repository/tournamentRepository";
import { PatchPlayerData } from "../../../player/types";
import { playerRepository } from "../../../player/repository/playerRepository";
import { parseSocketPayload } from "../../socketValidation";
import { ActiveTournament } from "./swissTournamentLogic/types";
import { kickFromTournamentSocketPayloadSchema } from "../../../tournament/validationSchemas/socketValidationSchemas";


export async function kickFromTournamentHandler(io: Server, socket: GameSocket, payload: KickFromTournamentPayload, 
            socketsByPlayerId: Map<string, GameSocket>, tournaments: Map<string, ActiveTournament>) {
    const parsedPayload = await parseSocketPayload(socket, kickFromTournamentSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { kickerId, playerId, tournamentId } = parsedPayload;
    console.log("Player ", kickerId, " wants to kick player ", playerId, " from tournament: \n\ntournamentId: ", tournamentId);
  
    try {
        const tournament = (await tournamentRepository.getById(tournamentId)).unwrap();
        if (kickerId !== tournament.owner.id) {
            console.error("❌ Only the owner can kick players from tournament");
            return;
        }

        const activeTournament = tournaments.get(tournamentId);

        const patchTournamentData: PatchTournamentData = {
            removePlayerIds: [ playerId ],
            numberOfPlayers: tournament.numberOfPlayers - 1,
        };
        await tournamentRepository.patch(tournamentId, patchTournamentData);

        const patchPlayerData: PatchPlayerData = {
            ongoingTournamentId: null,
        };
        await playerRepository.patch(playerId, patchPlayerData);

        if (activeTournament) {
            const initialCount = activeTournament.players.length;
            activeTournament.players = activeTournament.players.filter(player => player.id !== playerId);

            if (initialCount === activeTournament.players.length) {
                console.warn(`⚠️ Player ${playerId} was not found in active tournament ${tournamentId} roster during kick.`);
            }

            const hasOngoingMatch = activeTournament.rounds.some(round => !round.isComplete
                && round.matches.some(match => !match.isComplete && !match.isBye
                    && (match.whitePlayerId === playerId || match.blackPlayerId === playerId)));

            if (hasOngoingMatch) {
                console.log(`🕒 Player ${playerId} remains in current match for tournament ${tournamentId} until it finishes.`);
            }
        }

        const roomId = tournamentId;
        const kickedFromTournamentPayload: KickedFromTournamentPayload = {
            playerId: playerId,
            tournamentId: tournamentId,
        };
        io.to(roomId).emit(SocketEvent.KICKED_FROM_TOURNAMENT, kickedFromTournamentPayload);

        const playerSocket = socketsByPlayerId.get(playerId);
        if (playerSocket) {
            playerSocket.tournamentId = undefined;
            playerSocket.leave(roomId);
        }
    }
    catch (e) {
        console.error("Failed to process tournament action:", e);
        const errorPayload: ErrorPayload = {
            message: "Kick from tournament operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}
