import { Server } from "socket.io";
import { GameSocket } from "../../../socketHandlers";
import { AcceptDrawPayload, ErrorPayload } from "../../../socketPayloads";
import { GameResult } from "@prisma/client";
import { onGameFinished } from "../onGameFinished";
import { GameFinishedType } from "../gameFinishedTypes";
import { ActiveTournament } from "../../tournaments/swissTournamentLogic/types";
import { parseSocketPayload } from "../../../socketValidation";
import { IGameEngine } from "../../../../engine/IGameEngine";
import { drawSocketPayloadSchema } from "../../../../game/validationSchemas/socketValidationSchemas";
import { ActiveSpecialGame } from "../../../../engine/special/types";
import { VariantRegistry } from "../../../../engine/special/variants/VariantRegistry";
import { gameRepository } from "../../../../game/repository/gameRepository";
import { SocketEvent } from "../../../socketEvents";


export async function acceptDrawHandler(io: Server, socket: GameSocket, payload: AcceptDrawPayload, 
            gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>,
            tournaments: Map<string, ActiveTournament>, specialGames: Map<string, ActiveSpecialGame>,
            variantRegistry: VariantRegistry) {
    const parsedPayload = await parseSocketPayload(socket, drawSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, gameId } = parsedPayload;
    console.log("Player ", playerId, " accepts a draw");

    try {
        const engine = gameEngines.get(gameId);
        if (!engine) {
            console.error("Could not find the engine for the game");
            return;
        }

        const game = (await gameRepository.getById(gameId)).unwrap();
        if (playerId === game.whitePlayer.id) {
            if (engine.isOfferedDraw("b")){
                onGameFinished(io, GameFinishedType.DRAW, GameResult.DRAW, gameId, gameEngines,
                               socketsByPlayerId, tournaments, specialGames, variantRegistry);
                return;
            }
        }
        else if (playerId === game.blackPlayer.id) {
            if (engine.isOfferedDraw("w")){
                onGameFinished(io, GameFinishedType.DRAW, GameResult.DRAW, gameId, gameEngines,
                               socketsByPlayerId, tournaments, specialGames, variantRegistry);
                return;
            }
        }

        console.error("Draw was not offered");
    }
    catch (e) {
        console.error("Failed to load game:", e);
        const errorPayload: ErrorPayload = {
            message: "Loading game by id failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
    }
}
