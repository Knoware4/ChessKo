import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, ResignPayload } from "../../socketPayloads";
import { gameRepository } from "../../../game/repository/gameRepository";
import { GameResult, } from "@prisma/client";
import { onGameFinished } from "./onGameFinished";
import { GameFinishedType } from "./gameFinishedTypes";
import { SocketEvent } from "../../socketEvents";
import { ActiveTournament } from "../tournaments/swissTournamentLogic/types";
import { parseSocketPayload } from "../../socketValidation";
import { IGameEngine } from "../../../engine/IGameEngine";
import { resignSocketPayloadSchema } from "../../../game/validationSchemas/socketValidationSchemas";
import { ActiveSpecialGame } from "../../../engine/special/types";
import { VariantRegistry } from "../../../engine/special/variants/VariantRegistry";


export async function resignHandler(io: Server, socket: GameSocket, payload: ResignPayload, 
            gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>,
            tournaments: Map<string, ActiveTournament>, specialGames: Map<string, ActiveSpecialGame>,
            variantRegistry: VariantRegistry) {
    const parsedPayload = await parseSocketPayload(socket, resignSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, gameId } = parsedPayload;
    console.log("Player ", playerId, " wants to resign");

    try {
        const engine = gameEngines.get(gameId);
        if (!engine) {
            console.error("❌ No engine found for game", gameId);
            return;
        }
        console.log("socket playerId: ", socket.playerId)
        console.log("payload playerId: ", playerId)
        if (socket.playerId !== playerId) {
            console.error("❌ Invalid resign request (wrong socket player id)");
            return;
        }
        const game = (await gameRepository.getById(gameId)).unwrap();

        const gameResult = playerId === game.whitePlayer.id
            ? GameResult.BLACK
            : GameResult.WHITE;

        onGameFinished(io, GameFinishedType.RESIGN, gameResult, gameId, gameEngines,
                       socketsByPlayerId, tournaments, specialGames, variantRegistry);
    }
    catch (e) {
        console.error("Failed to load game:", e);
        const errorPayload: ErrorPayload = {
            message: "Loading game by id failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
    }
}
