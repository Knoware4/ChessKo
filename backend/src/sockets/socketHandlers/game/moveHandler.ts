import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, InvalidMovePayload, MovePayload, ValidMovePayload, ValidSpecialMoveWithAfterFen } from "../../socketPayloads";
import { SocketEvent } from "../../socketEvents";
import { gameRepository } from "../../../game/repository/gameRepository";
import { GameResult, UpgradeKey } from "@prisma/client";
import { onGameFinished } from "./onGameFinished";
import { GameFinishedType } from "./gameFinishedTypes";
import { ActiveTournament } from "../tournaments/swissTournamentLogic/types";
import { parseSocketPayload } from "../../socketValidation";
import { IGameEngine, SpecialParams } from "../../../engine/IGameEngine";
import { moveSocketPayloadSchema } from "../../../game/validationSchemas/socketValidationSchemas";
import { ActiveSpecialGame } from "../../../engine/special/types";
import { VariantRegistry } from "../../../engine/special/variants/VariantRegistry";
import { ExtraTurnDetails } from "../../../engine/special/upgrades/ExtraTurnUpgrade";
import { PawnDashDetails } from "../../../engine/special/upgrades/PawnDashUpgrade";


export async function moveHandler(io: Server, socket: GameSocket, payload: MovePayload, 
            gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>,
            tournaments: Map<string, ActiveTournament>, specialGames: Map<string, ActiveSpecialGame>,
            variantRegistry: VariantRegistry) {
    const parsedPayload = await parseSocketPayload(socket, moveSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, from, to, gameId, promotion, useExtraTurn, special } = parsedPayload;
    console.log("Player ", playerId, " wants to make move from ", from, " to ", to, " with promotion ", promotion,
                " and special move ", special, " in game ", gameId, " with extra turn ", useExtraTurn,
    );

    try {
        const engine = gameEngines.get(gameId);
        if (!engine) {
            console.error("❌ No engine found for game", gameId);
            return;
        }
        const currentPlayerColor = engine.getCurrentPlayer();
        const game = (await gameRepository.getById(gameId)).unwrap();
        if ((currentPlayerColor === "b" && playerId !== game.blackPlayer.id) ||
            (currentPlayerColor === "w" && playerId !== game.whitePlayer.id)) {
            console.error("Invalid move request (wrong player id)");
            return;
        }

        const specialParams: SpecialParams = {
            useExtraTurn: useExtraTurn ?? false,
        }
        
        const move = engine.makeMove({from, to, promotion, special}, specialParams);
        if (!move) {
            console.error("❌ Invalid move attempted by player", playerId);
            const invalidMovePayload: InvalidMovePayload = { playerId, gameId };
            socket.emit(SocketEvent.INVALID_MOVE, invalidMovePayload);
            return;
        }

        const winnerId = engine.getWinnerId();

        const validSpecialMovesWithAfterFens: ValidSpecialMoveWithAfterFen[] 
            = engine.getValidSpecialMovesWithAfterFens
                ? engine.getValidSpecialMovesWithAfterFens()
                : [];
        
        const upgradesDetails = engine.getUpgradesDetails
            ? engine.getUpgradesDetails()
            : undefined;
        
        const extraTurnDetails: ExtraTurnDetails | undefined =
                upgradesDetails?.get(UpgradeKey.EXTRA_TURN) as ExtraTurnDetails;
            
        const pawnDashDetails: PawnDashDetails | undefined =
            upgradesDetails?.get(UpgradeKey.PAWN_DASH) as PawnDashDetails;
    
        const turnsBeforeExtra = extraTurnDetails
            ? extraTurnDetails.turnsBeforeExtra
            : undefined;
    
        const remainingPawnDashes = pawnDashDetails
            ? pawnDashDetails.remainingDashes
            : undefined;

        const roomId = gameId;
        const whiteTime = engine.getWhiteTime();
        const blackTime = engine.getBlackTime();

        const newPlayerColor = engine.getCurrentPlayer();
        const extraTurnGranted = parsedPayload.useExtraTurn === true &&
                                 newPlayerColor === currentPlayerColor;
        const extraMoveFen = extraTurnGranted ? engine.getFen() : undefined;

        const validMovePayload: ValidMovePayload = {
            playerId, from, to, gameId, winnerId, whiteTime, blackTime,
            promotion, validSpecialMovesWithAfterFens, extraMoveFen,
            special, turnsBeforeExtra, remainingPawnDashes,
        };
        io.to(roomId).emit(SocketEvent.VALID_MOVE, validMovePayload);

        const isGameOver = engine.isGameOver();
        if (isGameOver) {
            const game = (await gameRepository.getById(gameId)).unwrap();
            const gameResult = winnerId === undefined
                ? GameResult.DRAW
                : winnerId === game.whitePlayer.id
                    ? GameResult.WHITE
                    : GameResult.BLACK;

            onGameFinished(io, GameFinishedType.MOVE, gameResult, gameId, gameEngines,
                           socketsByPlayerId, tournaments, specialGames, variantRegistry);
        }
    }
    catch (e) {
        console.error("Failed to load game or apply move:", e);
        const errorPayload: ErrorPayload = {
            message: "Loading game by id or applying move failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
    }
}
