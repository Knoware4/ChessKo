import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, GameFoundPayload, SearchGamePayload } from "../../socketPayloads";
import { IGameEngine } from "../../../engine/IGameEngine";
import { ActiveTournament } from "../tournaments/swissTournamentLogic/types";
import { ActiveSpecialGame } from "../../../engine/special/types";
import { VariantRegistry } from "../../../engine/special/variants/VariantRegistry";
import { parseSocketPayload } from "../../socketValidation";
import { searchGameSocketPayloadSchema } from "../../../game/validationSchemas/socketValidationSchemas";
import { playerRepository } from "../../../player/repository/playerRepository";
import { parseElo } from "../../../utils";
import { addToQueue, findOpponent, SearchGameRequest } from "../../../matchmaking";
import { NewGameData, PatchGameData } from "../../../game/types";
import { GameStatus } from "@prisma/client";
import { gameRepository } from "../../../game/repository/gameRepository";
import { ClassicChessEngine, ClassicChessEngineParams } from "../../../engine/ClassicChessEngine";
import { timeoutHandler } from "./timeoutHandler";
import { SocketEvent } from "../../socketEvents";


export async function searchGameHandler(io: Server, socket: GameSocket, payload: SearchGamePayload,
            gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>,
            tournaments: Map<string, ActiveTournament>, specialGames: Map<string, ActiveSpecialGame>,
            variantRegistry: VariantRegistry) {
    const parsedPayload = await parseSocketPayload(socket, searchGameSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, gameMode, matchType, tcMinutes, tcBonus } = parsedPayload;
    console.log("Player ", playerId, " wants to find game with attributes: \n\ngameMode: ", gameMode, 
        "\nmatchType: ", matchType, "\ntimeControl: minutes: ", tcMinutes, ", bonus: ", tcBonus);

    const estimatedTime = tcMinutes + (tcBonus * 40) / 60;
    const timeControl = estimatedTime < 3 ? "BULLET" :
                        estimatedTime < 10 ? "BLITZ" :
                        estimatedTime < 60 ? "RAPID" :
                        "CLASSIC";

    try {
        const player = (await playerRepository.getById(playerId)).unwrap();
        const elo = parseElo(true, gameMode, timeControl, player, player);

        const searchGameRequest: SearchGameRequest = { ...parsedPayload, socket, timeControl, elo };
        const opponent = findOpponent(searchGameRequest);

        if (opponent) {
            const newGameData: NewGameData = {
                gameMode, matchType, tcMinutes, tcBonus,
                gameStatus: GameStatus.ONGOING,
                player1Id: playerId,
                player2Id: opponent.playerId,
            };
            const newGame = (await gameRepository.create(newGameData)).unwrap();

            await playerRepository.patch(playerId, { ongoingGameId: newGame.id });
            await playerRepository.patch(opponent.playerId, { ongoingGameId: newGame.id });

            const classicChessEngineParams: ClassicChessEngineParams = {
                whitePlayerId: newGame.whitePlayer.id, 
                blackPlayerId: newGame.blackPlayer.id,
                gameId: newGame.id,
                onTimeout: timeoutHandler,
                io, tcMinutes, tcBonus, gameEngines, socketsByPlayerId,
                tournaments, specialGames, variantRegistry
            };
            const engine: ClassicChessEngine = new ClassicChessEngine(classicChessEngineParams);
            gameEngines.set(newGame.id, engine);

            const patchGameData: PatchGameData = {
                gameStatus: GameStatus.ONGOING,
                startedAt: new Date(),
            }
            await gameRepository.patch(newGame.id, patchGameData);

            const roomId = newGame.id;
            opponent.socket.join(roomId);
            socket.join(roomId);
            opponent.socket.gameId = newGame.id;
            socket.gameId = newGame.id;

            const gameFoundPayload: GameFoundPayload = {
                gameId: newGame.id,
            };
            io.to(roomId).emit(SocketEvent.GAME_FOUND, gameFoundPayload);

            console.log(`✅ Match found: ${playerId} vs ${opponent.playerId}`);
        } else {
            if (addToQueue(searchGameRequest)) {
                console.log(`🕒 Player ${playerId} waiting in queue`);
            } else {
                console.log(`❌ Player ${playerId} already is in the queue`);
                socket.emit(SocketEvent.ALREADY_IN_THE_QUEUE, {});
            }
        }
    }
    catch (e) {
        console.error("Failed to process game action:", e);
        const errorPayload: ErrorPayload = {
            message: "Search/start game operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}
