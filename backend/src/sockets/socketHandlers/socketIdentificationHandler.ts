import { Server } from "socket.io";
import { GameSocket } from "../socketHandlers";
import { SocketIdentificationPayload } from "../socketPayloads";
import { playerRepository } from "../../player/repository/playerRepository";
import { parseSocketPayload } from "../socketValidation";
import { socketIdentificationPayloadSchema } from "../../player/validationSchemas/socketValidationSchemas";


export async function socketIdentificationHandler(io: Server, socket: GameSocket, payload: SocketIdentificationPayload, socketsByPlayerId: Map<string, GameSocket>) {
    const parsedPayload = await parseSocketPayload(socket, socketIdentificationPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId } = parsedPayload;

    try {
        const player = (await playerRepository.getById(playerId)).unwrap();
        const ongoingTournamentId = player.ongoingTournamentId;
        const ongoingGameId = player.ongoingGameId;
        const ongoingSpecialGameId = player.ongoingSpecialGameId;

        socket.playerId = player.id;
        if (ongoingGameId) {
            socket.gameId = ongoingGameId;
            socket.join(ongoingGameId);
        }
        if (ongoingTournamentId) {
            socket.tournamentId = ongoingTournamentId;
            socket.join(ongoingTournamentId);
        }
        if (ongoingSpecialGameId) {
            socket.specialGameId = ongoingSpecialGameId;
            socket.join(ongoingSpecialGameId);
        }
        socketsByPlayerId.set(socket.playerId, socket);

        console.log("🔌 Player connected\nplayerId: ", socket.playerId, "\nsocketId: ", socket.id, "\nongoingGameId: ",
                    socket.gameId, "\nongoingTournamentId: ", socket.tournamentId, "\nongoingSpecialGameId: ", socket.specialGameId, "\n\n");
    } catch (error) {
        console.error("Failed to identify socket:", error);
    }
}
