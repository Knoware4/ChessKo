import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, LeaveSpecialGamePayload, LeftSpecialGamePayload, SpecialGameCanceledPayload } from "../../socketPayloads";
import { parseSocketPayload } from "../../socketValidation";
import { leaveSpecialGameSocketPayloadSchema } from "../../../specialGame/validationSchemas/socketValidationSchemas";
import { specialGameRepository } from "../../../specialGame/repository/specialGameRepository";
import { PatchSpecialGameData, SpecialGameNormal } from "../../../specialGame/types";
import { PatchPlayerData } from "../../../player/types";
import { playerRepository } from "../../../player/repository/playerRepository";
import { SocketEvent } from "../../socketEvents";



export async function leaveSpecialGameHandler(io: Server, socket: GameSocket, payload: LeaveSpecialGamePayload,
            socketsByPlayerId: Map<string, GameSocket>) {
    const parsedPayload = await parseSocketPayload(socket, leaveSpecialGameSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, specialGameId } = parsedPayload;
    console.log("Player ", playerId, " wants to leave special game: \n\nspecialGameId: ", specialGameId);

    const roomId = specialGameId;
    const playerSocket = socketsByPlayerId.get(playerId);

    try {
        const specialGame = (await specialGameRepository.getById(specialGameId)).unwrap();
        const isOwner = playerId === specialGame.owner.id;
        if (specialGame.startedAt) {
            console.error("❌ Players can not leave an ongoing special game");
            return;
        }

        if (!isOwner) {
            const patchSpecialGameData: PatchSpecialGameData = {
                removePlayerIds: [ playerId ],
                numberOfPlayers: specialGame.numberOfPlayers - 1,
            };
            await specialGameRepository.patch(specialGameId, patchSpecialGameData);

            const patchPlayerData: PatchPlayerData = {
                ongoingSpecialGameId: null,
            };
            await playerRepository.patch(playerId, patchPlayerData);

            const leftSpecialGamePayload: LeftSpecialGamePayload = parsedPayload;
            io.to(roomId).emit(SocketEvent.LEFT_SPECIAL_GAME, leftSpecialGamePayload);

            if (playerSocket) {
                playerSocket.specialGameId = undefined;
                playerSocket.leave(roomId);
            }
        }
        else {
            await cancelSpecialGame(io, specialGame, socketsByPlayerId);
        }
    }
    catch (e) {
        console.error("Failed to process specialGame action:", e);
        const errorPayload: ErrorPayload = {
            message: "Leave specialGame operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}

async function cancelSpecialGame(io: Server, specialGame: SpecialGameNormal, socketsByPlayerId: Map<string, GameSocket>) {
    const specialGameId = specialGame.id;
    const players = (await specialGameRepository.getSpecialGamePlayers(specialGameId, { pagesize: 64 })).unwrap().players;
    const roomId = specialGameId;

    const specialGameCanceledPayload: SpecialGameCanceledPayload = {
        specialGameId,
    };
    io.to(roomId).emit(SocketEvent.SPECIAL_GAME_CANCELED, specialGameCanceledPayload);

    const playerPatchPromises: Promise<unknown>[] = [];
    players.forEach(player => {
        const patchPlayerData: PatchPlayerData = {
            ongoingSpecialGameId: null,
        };
        playerPatchPromises.push(playerRepository.patch(player.id, patchPlayerData));

        const playerSocket = socketsByPlayerId.get(player.id);
        if (playerSocket) {
            playerSocket.specialGameId = undefined;
            playerSocket.leave(roomId);
        }
    });

    if (playerPatchPromises.length > 0) {
        const results = await Promise.allSettled(playerPatchPromises);
        results.forEach(result => {
            if (result.status === "rejected") {
                console.error("❌ Failed to update ongoingSpecialGameId after specialGame cancellation", result.reason);
            }
        });
    }

    await specialGameRepository.delete(specialGameId);
}
