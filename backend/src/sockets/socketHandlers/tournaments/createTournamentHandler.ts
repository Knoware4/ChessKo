import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { CreateTournamentPayload, ErrorPayload, TournamentCreatedPayload } from "../../socketPayloads";
import { NewTournamentData } from "../../../tournament/types";
import { tournamentRepository } from "../../../tournament/repository/tournamentRepository";
import { SocketEvent } from "../../socketEvents";
import { PatchPlayerData } from "../../../player/types";
import { playerRepository } from "../../../player/repository/playerRepository";
import { parseSocketPayload } from "../../socketValidation";
import { createTournamentSocketPayloadSchema } from "../../../tournament/validationSchemas/socketValidationSchemas";


export async function createTournamentHandler(io: Server, socket: GameSocket, payload: CreateTournamentPayload) {
    if (socket.specialGameId) {
        console.error("Can not create a tournament while in special game");
        return;
    }
    const parsedPayload = await parseSocketPayload(socket, createTournamentSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, name, tcMinutes, tcBonus, specialConfiguration } = parsedPayload;
    console.log("Player ", playerId, " wants to create tournament with attributes: \n\nname: ", name,
        "\ntimeControl: minutes: ", tcMinutes, ", bonus: ", tcBonus);

    try {
        const newTournamentData: NewTournamentData = {
            name, tcMinutes, tcBonus,
            playerIds: [ playerId ],
            ownerId: playerId,
            specialConfiguration,
        };
        const tournament = (await tournamentRepository.create(newTournamentData)).unwrap();

        const patchPlayerData: PatchPlayerData = {
            ongoingTournamentId: tournament.id,
        };
        await playerRepository.patch(playerId, patchPlayerData);

        const roomId = tournament.id;
        socket.join(roomId);
        socket.tournamentId = tournament.id;

        const tournamentCreatedPayload: TournamentCreatedPayload = {
            ...parsedPayload,
            tournamentId: tournament.id
        };
        io.to(roomId).emit(SocketEvent.TOURNAMENT_CREATED, tournamentCreatedPayload);
    }
    catch (e) {
        console.error("Failed to process tournament action:", e);
        const errorPayload: ErrorPayload = {
            message: "Create tournament operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
    }
}
