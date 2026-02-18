import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, TimeoutPayload } from "../../socketPayloads";
import { gameRepository } from "../../../game/repository/gameRepository";
import { GameResult, } from "@prisma/client";
import { onGameFinished } from "./onGameFinished";
import { GameFinishedType } from "./gameFinishedTypes";
import { SocketEvent } from "../../socketEvents";
import { ActiveTournament } from "../tournaments/swissTournamentLogic/types";
import { fromZodError } from "zod-validation-error";
import { IGameEngine } from "../../../engine/IGameEngine";
import { timeoutSocketPayloadSchema } from "../../../game/validationSchemas/socketValidationSchemas";
import { VariantRegistry } from "../../../engine/special/variants/VariantRegistry";
import { ActiveSpecialGame } from "../../../engine/special/types";


export async function timeoutHandler(io: Server, payload: TimeoutPayload, 
            gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>,
            tournaments: Map<string, ActiveTournament>, specialGames: Map<string, ActiveSpecialGame>,
            variantRegistry: VariantRegistry) {
    const roomId = payload.gameId;
    if (!payload.gameId || (typeof payload.gameId !== "string")) {
        console.error("Error time-outing for invalid gameId in payload!");
    }
    const parsedPayload = await timeoutSocketPayloadSchema.safeParseAsync(payload);

    if (!parsedPayload.success || parsedPayload.data === undefined) {
        const error = fromZodError(parsedPayload.error);
        const errorPayload: ErrorPayload = {
            message: error.message,
        };
        io.to(roomId).emit(SocketEvent.ERROR, errorPayload);
        return;
    }

    const { gameId, winnerId, loserId} = parsedPayload.data;
    console.log("Player ", loserId, " was timed out. Thus player ", winnerId, " wins.");

    try {
        const game = (await gameRepository.getById(gameId)).unwrap();
        const gameResult = winnerId === game.whitePlayer.id
            ? GameResult.WHITE
            : GameResult.BLACK;

        onGameFinished(io, GameFinishedType.TIMEOUT, gameResult, gameId, gameEngines,
                       socketsByPlayerId, tournaments, specialGames, variantRegistry);
    }
    catch (e) {
        console.error("Failed to load game:", e);
        const errorPayload: ErrorPayload = {
            message: "Loading game by id failed.",
        };
        io.to(roomId).emit(SocketEvent.ERROR, errorPayload);
    }
}
