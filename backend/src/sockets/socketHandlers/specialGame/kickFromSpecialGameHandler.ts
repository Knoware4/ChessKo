import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, KickedFromSpecialGamePayload, KickFromSpecialGamePayload } from "../../socketPayloads";
import { parseSocketPayload } from "../../socketValidation";
import { kickFromSpecialGameSocketPayloadSchema } from "../../../specialGame/validationSchemas/socketValidationSchemas";
import { specialGameRepository } from "../../../specialGame/repository/specialGameRepository";
import { PatchSpecialGameData } from "../../../specialGame/types";
import { PatchPlayerData } from "../../../player/types";
import { playerRepository } from "../../../player/repository/playerRepository";
import { SocketEvent } from "../../socketEvents";


export async function kickFromSpecialGameHandler(io: Server, socket: GameSocket, payload: KickFromSpecialGamePayload, 
            socketsByPlayerId: Map<string, GameSocket>) {
    const parsedPayload = await parseSocketPayload(socket, kickFromSpecialGameSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { kickerId, playerId, specialGameId } = parsedPayload;
    console.log("Player ", kickerId, " wants to kick player ", playerId, " from specialGame: \n\nspecialGameId: ", specialGameId);
  
    try {
        const specialGame = (await specialGameRepository.getById(specialGameId)).unwrap();

        const isOwner = kickerId === specialGame.owner.id;
        if (!isOwner) {
            console.error("❌ Only the owner can kick players from specialGame");
            return;
        }
        if (specialGame.startedAt) {
            console.error("❌ Players can not be kicked from special game that has been started");
            return;
        }

        const patchSpecialGameData: PatchSpecialGameData = {
            removePlayerIds: [ playerId ],
            numberOfPlayers: specialGame.numberOfPlayers - 1,
        };
        await specialGameRepository.patch(specialGameId, patchSpecialGameData);

        const patchPlayerData: PatchPlayerData = {
            ongoingSpecialGameId: null,
        };
        await playerRepository.patch(playerId, patchPlayerData);

        const roomId = specialGameId;
        const kickedFromSpecialGamePayload: KickedFromSpecialGamePayload = {
            playerId: playerId,
            specialGameId: specialGameId,
        };
        io.to(roomId).emit(SocketEvent.KICKED_FROM_SPECIAL_GAME, kickedFromSpecialGamePayload);

        const playerSocket = socketsByPlayerId.get(playerId);
        if (playerSocket) {
            playerSocket.specialGameId = undefined;
            playerSocket.leave(roomId);
        }
    }
    catch (e) {
        console.error("Failed to process special game action:", e);
        const errorPayload: ErrorPayload = {
            message: "Kick from special game operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}
