import { Server } from "socket.io";
import { DrawAcceptedPayload, ErrorPayload, ResignedPayload, TimeoutPayload, } from "../../socketPayloads";
import { GameSocket } from "../../socketHandlers";
import { gameRepository } from "../../../game/repository/gameRepository";
import { calculateElo, assignEloAfter } from "../../../utils";
import { GameMode, GameResult, GameStatus, MatchType } from "@prisma/client";
import { PatchGameData } from "../../../game/types";
import { PatchPlayerData } from "../../../player/types";
import { SocketEvent } from "../../socketEvents";
import { GameFinishedType } from "./gameFinishedTypes";
import { ActiveTournament } from "../tournaments/swissTournamentLogic/types";
import { handleTournamentGameCompletion } from "../tournaments/swissTournamentLogic/gameLifecycle";
import { IGameEngine } from "../../../engine/IGameEngine";
import { ActiveSpecialGame, SpecialGameGameCompletionContext } from "../../../engine/special/types";
import { VariantRegistry } from "../../../engine/special/variants/VariantRegistry";


export async function onGameFinished(io: Server, gameFinishedType: GameFinishedType, gameResult: GameResult,
            gameId: string, gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>,
            tournaments: Map<string, ActiveTournament>, specialGames: Map<string, ActiveSpecialGame>,
            variantRegistry: VariantRegistry) {
    try {
        const game = (await gameRepository.getById(gameId)).unwrap();
        if (game.finishedAt) {
            console.error("Game has already finished");
            return;
        }

        const whitePlayerId = game.whitePlayer.id;
        const blackPlayerId = game.blackPlayer.id;

        const whitePlayerSocket = socketsByPlayerId.get(whitePlayerId);
        const blackPlayerSocket = socketsByPlayerId.get(blackPlayerId);

        const engine = gameEngines.get(gameId);
        if (!engine) {
            console.error("❌ No engine found for game", gameId);
            return;
        }

        const finishedAt = new Date();
        const gameStatus = GameStatus.FINISHED;
        const pgn = engine.getPgn();
        const scoreWhite = gameResult === GameResult.WHITE ? 1 
                         : gameResult === GameResult.BLACK ? 0 : 0.5;
        const scoreBlack = 1 - scoreWhite;
        const { whiteEloAfter, blackEloAfter } = calculateElo(
            game.whiteEloBefore, game.blackEloBefore, scoreWhite, scoreBlack);


        const patchGameData: PatchGameData = {
            gameStatus, gameResult, finishedAt,
            whiteEloAfter: game.matchType === MatchType.RATED && game.gameMode === GameMode.CLASSIC 
                                                ? whiteEloAfter
                                                : game.whiteEloBefore,
            blackEloAfter: game.matchType === MatchType.RATED && game.gameMode === GameMode.CLASSIC
                                                ? blackEloAfter
                                                : game.blackEloBefore,
            pgn: game.gameMode === GameMode.CLASSIC ? pgn : undefined,
        };
        const patchWhitePlayerData: PatchPlayerData = {
            ongoingGameId: null,
            ...(game.matchType === MatchType.RATED && game.gameMode === GameMode.CLASSIC
                ? assignEloAfter(game, whiteEloAfter) 
                : {}),
        };
        const patchBlackPlayerData: PatchPlayerData = {
            ongoingGameId: null,
            ...(game.matchType === MatchType.RATED && game.gameMode === GameMode.CLASSIC
                ? assignEloAfter(game, blackEloAfter)
                : {}),
        };
        await gameRepository.finishGameWithPlayers(gameId, patchGameData, whitePlayerId,
            patchWhitePlayerData, blackPlayerId, patchBlackPlayerData);


        const winnerId = gameResult === GameResult.WHITE
            ? whitePlayerId
            : blackPlayerId;
        const loserId = gameResult === GameResult.WHITE
            ? blackPlayerId
            : whitePlayerId;

        const roomId = gameId;
        if (gameFinishedType === GameFinishedType.DRAW) {
            const drawAcceptedPayload: DrawAcceptedPayload = {
                gameId
            };
            io.to(roomId).emit(SocketEvent.DRAW_ACCEPTED, drawAcceptedPayload);
        }
        else if (gameFinishedType === GameFinishedType.RESIGN) {
            const loserId = gameResult === GameResult.WHITE
                ? blackPlayerId
                : whitePlayerId;
            const resignedPayload: ResignedPayload = {
                gameId,
                winnerId,
                loserId,
            };
            io.to(roomId).emit(SocketEvent.RESIGNED, resignedPayload);
        }
        else if (gameFinishedType === GameFinishedType.TIMEOUT) {
            const timeoutPayload: TimeoutPayload = {
                gameId,
                winnerId,
                loserId,
            };
            io.to(roomId).emit(SocketEvent.TIMEOUT, timeoutPayload);
        }

        if (game.matchType === MatchType.TOURNAMENT) {
            await handleTournamentGameCompletion(io, tournaments, game.tournamentId, gameId, gameResult, gameEngines,
                                                 socketsByPlayerId, specialGames, variantRegistry);
        }

        if (game.gameMode === GameMode.SPECIAL) {
            const specialGame = Array.from(specialGames.values())
                .find(active => active.matchesByGameId.has(gameId));
            if (specialGame) {
                const variant = variantRegistry.getVariant(specialGame.configuration.variantKey);
                if (!variant) {
                    console.error("Could not find the special chess variant");
                    return
                }
                const orchestrator = variant.createOrchestrator();
                const completionContext: SpecialGameGameCompletionContext = {
                    io, specialGame, gameEngines, socketsByPlayerId,
                    specialGames, gameId,
                    result: gameResult,
                };
                await orchestrator.handleSpecialGameGameCompletion(completionContext);
            }
        }

        if (whitePlayerSocket) {
            whitePlayerSocket.leave(roomId);
            if (whitePlayerSocket.gameId === gameId) {
                whitePlayerSocket.gameId = undefined;
            }
        }
        if (blackPlayerSocket) {
            blackPlayerSocket.leave(roomId);
            if (blackPlayerSocket.gameId === gameId) {
                blackPlayerSocket.gameId = undefined;
            }
        }

        engine.dispose();
        gameEngines.delete(gameId);
    }
    catch (e) {
        const roomId = gameId;
        console.error("Failed to process game finishing action:", e);
        if (gameFinishedType === GameFinishedType.DRAW) {
            const errorPayload: ErrorPayload = {
                message: "Finishing game by draw operation failed.",
            };
            io.to(roomId).emit(SocketEvent.ERROR, errorPayload);
        }
        else if (gameFinishedType === GameFinishedType.RESIGN) {
            const errorPayload: ErrorPayload = {
                message: "Finishing game by resign operation failed.",
            };
            io.to(roomId).emit(SocketEvent.ERROR, errorPayload);
        }
        else if (gameFinishedType === GameFinishedType.TIMEOUT) {
            const errorPayload: ErrorPayload = {
                message: "Finishing game by timeout operation failed.",
            };
            io.to(roomId).emit(SocketEvent.ERROR, errorPayload);
        } else {  // MOVE
            const errorPayload: ErrorPayload = {
                message: "Finishing game by move operation failed.",
            };
            io.to(roomId).emit(SocketEvent.ERROR, errorPayload);
        }
    }
}
