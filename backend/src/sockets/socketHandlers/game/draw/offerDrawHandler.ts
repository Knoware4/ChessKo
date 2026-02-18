import { Server } from "socket.io";
import { GameSocket } from "../../../socketHandlers";
import { DrawOfferedPayload, ErrorPayload, OfferDrawPayload } from "../../../socketPayloads";
import { SocketEvent } from "../../../socketEvents";
import { parseSocketPayload } from "../../../socketValidation";
import { drawSocketPayloadSchema } from "../../../../game/validationSchemas/socketValidationSchemas";
import { IGameEngine } from "../../../../engine/IGameEngine";
import { gameRepository } from "../../../../game/repository/gameRepository";


export async function offerDrawHandler(io: Server, socket: GameSocket, payload: OfferDrawPayload,
        gameEngines: Map<string, IGameEngine>) {
    const parsedPayload = await parseSocketPayload(socket, drawSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, gameId } = parsedPayload;
    console.log("Player ", playerId, " offers a draw");

    try {
        const engine = gameEngines.get(gameId);
        if (!engine) {
            console.error("Could not find the engine for the game");
            return;
        }

        const game = (await gameRepository.getById(gameId)).unwrap();
        if (playerId === game.whitePlayer.id) {
            engine.offerDraw("w");
        }
        else if (playerId === game.blackPlayer.id) {
            engine.offerDraw("b");
        }

        const drawOfferedPayload: DrawOfferedPayload = parsedPayload;
        socket.to(gameId).emit(SocketEvent.DRAW_OFFERED, drawOfferedPayload);
    }
    catch (e) {
        console.error("Failed to load game:", e);
        const errorPayload: ErrorPayload = {
            message: "Loading game by id failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
    }
}
