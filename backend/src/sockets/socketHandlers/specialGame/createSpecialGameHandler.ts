import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { parseSocketPayload } from "../../socketValidation";
import { SocketEvent } from "../../socketEvents";
import { CreateSpecialGamePayload, ErrorPayload, SpecialGameCreatedPayload } from "../../socketPayloads";
import { createSpecialGameSocketPayloadSchema } from "../../../game/validationSchemas/socketValidationSchemas";
import { NewSpecialGameData } from "../../../specialGame/types";
import { specialGameRepository } from "../../../specialGame/repository/specialGameRepository";
import { PatchPlayerData } from "../../../player/types";
import { playerRepository } from "../../../player/repository/playerRepository";
import { VariantRegistry } from "../../../engine/special/variants/VariantRegistry";
import { SpecialChessEngine } from "../../../engine/SpecialChessEngine";


export async function createSpecialGameHandler(io: Server, socket: GameSocket, payload: CreateSpecialGamePayload,
                                               variantRegistry: VariantRegistry) {
    if (socket.tournamentId) {
        console.error("Can not create a special game while in tournament");
        return;
    }
    const parsedPayload = await parseSocketPayload(socket, createSpecialGameSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, name, matchType, tcMinutes, tcBonus, specialConfiguration, specialConfigurationId } = parsedPayload;

    try {
        const specialConfigurationDeserialized = SpecialChessEngine.deserializeConfiguration(specialConfiguration);
        const variant = variantRegistry.getVariant(specialConfigurationDeserialized.variantKey);
        if (!variant) {
            throw new Error("Invalid variant key in special configuration");
        }

        const newSpecialGameData: NewSpecialGameData = {
            name, matchType, tcMinutes, tcBonus,
            playerIds: [ playerId ],
            ownerId: playerId,
            totalRounds: variant.totalRounds,
            specialConfiguration, specialConfigurationId,
        };
        const specialGame = (await specialGameRepository.create(newSpecialGameData)).unwrap();
        const specialGameId = specialGame.id;

        const patchPlayerData: PatchPlayerData = {
            ongoingSpecialGameId: specialGameId,
        };
        await playerRepository.patch(playerId, patchPlayerData);

        const roomId = specialGameId;
        socket.join(roomId);
        socket.specialGameId = specialGameId;

        const specialGameCreatedPayload: SpecialGameCreatedPayload = {
            specialGameId, playerId, name, matchType, tcMinutes,
            tcBonus, specialConfiguration,
            specialConfigurationId: specialConfigurationId ?? null,
        };
        io.to(roomId).emit(SocketEvent.SPECIAL_GAME_CREATED, specialGameCreatedPayload);
    }
    catch (e) {
        console.error("Failed to process game action:", e);
        const errorPayload: ErrorPayload = {
            message: "Create special game operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}
