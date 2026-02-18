import { Server } from "socket.io";
import { GameSocket } from "../socketHandlers";
import { ErrorPayload, SaveConfigurationPayload } from "../socketPayloads";
import { parseSocketPayload } from "../socketValidation";
import { saveConfigurationPayloadSchema } from "../../player/validationSchemas/socketValidationSchemas";
import { playerRepository } from "../../player/repository/playerRepository";
import { SocketEvent } from "../socketEvents";


export async function saveConfigurationHandler(io: Server, socket: GameSocket, payload: SaveConfigurationPayload) {
    const parsedPayload = await parseSocketPayload(socket, saveConfigurationPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, specialConfigurationId } = parsedPayload;
    console.log("Player ", playerId, " wants to save configuration: \n\nspecialConfigurationId: ", specialConfigurationId);

    try {
        const configurations = (await playerRepository.getPlayerSavedConfigurations(playerId, { pagesize: 100 }))
                                .unwrap()
                                .specialConfigurations;
        const alreadySaved = configurations.find(config => config.id === specialConfigurationId);
        if (alreadySaved) {
            console.log("Configuration already saved for player ", playerId);
            return;
        }
        await playerRepository.saveConfiguration(playerId, specialConfigurationId);
    }
    catch (e) {
        console.error("Failed to process saving special configuration:", e);
        const errorPayload: ErrorPayload = {
            message: "Kick from tournament operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}
