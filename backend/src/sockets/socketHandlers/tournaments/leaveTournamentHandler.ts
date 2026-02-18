import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, LeaveTournamentPayload, LeftTournamentPayload, TournamentCanceledPayload } from "../../socketPayloads";
import { SocketEvent } from "../../socketEvents";
import { PatchTournamentData, TournamentNormal } from "../../../tournament/types";
import { tournamentRepository } from "../../../tournament/repository/tournamentRepository";
import { PatchPlayerData } from "../../../player/types";
import { playerRepository } from "../../../player/repository/playerRepository";
import { parseSocketPayload } from "../../socketValidation";
import { ActiveTournament } from "./swissTournamentLogic/types";
import { leaveTournamentSocketPayloadSchema } from "../../../tournament/validationSchemas/socketValidationSchemas";



export async function leaveTournamentHandler(io: Server, socket: GameSocket, payload: LeaveTournamentPayload,
            socketsByPlayerId: Map<string, GameSocket>, tournaments: Map<string, ActiveTournament>) {
    const parsedPayload = await parseSocketPayload(socket, leaveTournamentSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, tournamentId } = parsedPayload;
    console.log("Player ", playerId, " wants to leave tournament: \n\ntournamentId: ", tournamentId);

    const roomId = tournamentId;
    const playerSocket = socketsByPlayerId.get(playerId);

    try {
        const tournament = (await tournamentRepository.getById(tournamentId)).unwrap();
        const isOngoing = tournament.startedAt !== undefined && tournament.finishedAt === undefined;
        const isOwner = playerId === tournament.owner.id;

        if (!isOngoing) {
            if (!isOwner) {
                const patchTournamentData: PatchTournamentData = {
                    removePlayerIds: [ playerId ],
                    numberOfPlayers: tournament.numberOfPlayers - 1,
                };
                await tournamentRepository.patch(tournamentId, patchTournamentData);

                const patchPlayerData: PatchPlayerData = {
                    ongoingTournamentId: null,
                };
                await playerRepository.patch(playerId, patchPlayerData);

                const leftTournamentPayload: LeftTournamentPayload = parsedPayload;
                io.to(roomId).emit(SocketEvent.LEFT_TOURNAMENT, leftTournamentPayload);

                if (playerSocket) {
                    playerSocket.tournamentId = undefined;
                    playerSocket.leave(roomId);
                }
            }
            else {
                await cancelTournament(io, tournament, socketsByPlayerId);
            }
        }
        else {
            const patchPlayerData: PatchPlayerData = {
                ongoingTournamentId: null,
            };
            await playerRepository.patch(playerId, patchPlayerData);

            const activeTournament = tournaments.get(tournamentId);
            if (activeTournament) {
                const initialCount = activeTournament.players.length;
                activeTournament.players = activeTournament.players.filter(player => player.id !== playerId);

                if (initialCount === activeTournament.players.length) {
                    console.warn(`⚠️ Player ${playerId} was not found in active tournament ${tournamentId} roster during leaving.`);
                }

                const hasOngoingMatch = activeTournament.rounds.some(round => !round.isComplete
                    && round.matches.some(match => !match.isComplete && !match.isBye
                        && (match.whitePlayerId === playerId || match.blackPlayerId === playerId)));

                if (hasOngoingMatch) {
                    console.log(`🕒 Player ${playerId} remains in current match for tournament ${tournamentId} until it finishes.`);
                }
            }

            const leftTournamentPayload: LeftTournamentPayload = parsedPayload;
            io.to(roomId).emit(SocketEvent.LEFT_TOURNAMENT, leftTournamentPayload);

            if (playerSocket) {
                playerSocket.tournamentId = undefined;
                playerSocket.leave(roomId);
            }
        }
    }
    catch (e) {
        console.error("Failed to process tournament action:", e);
        const errorPayload: ErrorPayload = {
            message: "Leave tournament operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}

async function cancelTournament(io: Server, tournament: TournamentNormal, socketsByPlayerId: Map<string, GameSocket>) {
    const tournamentId = tournament.id;
    const players = (await tournamentRepository.getTournamentPlayers(tournamentId, { pagesize: 64 })).unwrap().players;
    const roomId = tournamentId;

    const tournamentCanceledPayload: TournamentCanceledPayload = {
        tournamentId,
    };
    io.to(roomId).emit(SocketEvent.TOURNAMENT_CANCELED, tournamentCanceledPayload);

    const playerPatchPromises: Promise<unknown>[] = [];
    players.forEach(player => {
        const patchPlayerData: PatchPlayerData = {
            ongoingTournamentId: null,
        };
        playerPatchPromises.push(playerRepository.patch(player.id, patchPlayerData));

        const playerSocket = socketsByPlayerId.get(player.id);
        if (playerSocket) {
            playerSocket.tournamentId = undefined;
            playerSocket.leave(roomId);
        }
    });

    if (playerPatchPromises.length > 0) {
        const results = await Promise.allSettled(playerPatchPromises);
        results.forEach(result => {
            if (result.status === "rejected") {
                console.error("❌ Failed to update ongoingTournamentId after tournament cancellation", result.reason);
            }
        });
    }

    await tournamentRepository.delete(tournamentId);
}
