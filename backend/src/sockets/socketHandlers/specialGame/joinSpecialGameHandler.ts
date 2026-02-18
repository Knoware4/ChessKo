import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { parseSocketPayload } from "../../socketValidation";
import { SocketEvent } from "../../socketEvents";
import { ErrorPayload, JoinSpecialGamePayload, SpecialGameJoinedPayload } from "../../socketPayloads";
import { joinSpecialGameSocketPayloadSchema } from "../../../game/validationSchemas/socketValidationSchemas";
import { GetSpecialGamePlayersData, PatchSpecialGameData, SpecialConfigurationNormal, SpecialGameNormal } from "../../../specialGame/types";
import { specialGameRepository } from "../../../specialGame/repository/specialGameRepository";
import { PatchPlayerData } from "../../../player/types";
import { playerRepository } from "../../../player/repository/playerRepository";
import { VariantRegistry } from "../../../engine/special/variants/VariantRegistry";


export async function joinSpecialGameHandler(io: Server, socket: GameSocket, payload: JoinSpecialGamePayload,
                                             variantRegistry: VariantRegistry) {
    if (socket.tournamentId) {
        console.error("Can not join a special game while in tournament");
        return;
    }
    const parsedPayload = await parseSocketPayload(socket, joinSpecialGameSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, specialGameId } = parsedPayload;
    console.log("Player ", playerId, " wants to join special game: \n\specialGameId: ", specialGameId);

    try {
        const getSpecialGamePlayersData: GetSpecialGamePlayersData = { pagesize: 32 };
        const specialGame: SpecialGameNormal = (await specialGameRepository.getById(specialGameId)).unwrap();
        const specialGamePlayers = (await specialGameRepository.getSpecialGamePlayers(specialGameId, getSpecialGamePlayersData)).unwrap();
        
        const configuration: SpecialConfigurationNormal = specialGame.specialConfiguration;
        const variant = variantRegistry.getVariant(configuration.variantKey);
        if (!variant) {
            console.error("Failed to load the special game variant");
            return;
        }
        
        if (specialGamePlayers.totalCount === variant.maximumCapacity) {
            console.error("❌ This special game has reached its maximum capacity");
            return;
        }
        if (specialGame.startedAt) {
            console.error("❌ Can not join a special game that has already started");
            return;
        }

        const patchSpecialGameData: PatchSpecialGameData = {
            addPlayerIds: [ playerId ],
            numberOfPlayers: specialGame.numberOfPlayers + 1,
        };
        await specialGameRepository.patch(specialGameId, patchSpecialGameData);

        const patchPlayerData: PatchPlayerData = {
            ongoingSpecialGameId: specialGameId,
        };
        await playerRepository.patch(playerId, patchPlayerData);

        const roomId = specialGameId;
        socket.join(roomId);
        socket.specialGameId = specialGameId;

        const specialGameJoinedPayload: SpecialGameJoinedPayload = parsedPayload;
        io.to(roomId).emit(SocketEvent.SPECIAL_GAME_JOINED, specialGameJoinedPayload);
    }
    catch (e) {
        console.error("Failed to process game action:", e);
        const errorPayload: ErrorPayload = {
            message: "Join special game operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}
