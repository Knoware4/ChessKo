import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { LoadOngoingGamePayload, NoOngoingGamePayload, OngoingGameLoadedPayload, ValidSpecialMoveWithAfterFen } from "../../socketPayloads";
import { SocketEvent } from "../../socketEvents";
import { parseSocketPayload } from "../../socketValidation";
import { IGameEngine } from "../../../engine/IGameEngine";
import { loadOngoingGameSocketPayloadSchema } from "../../../game/validationSchemas/socketValidationSchemas";
import { UpgradeKey } from "@prisma/client";
import { ExtraTurnDetails } from "../../../engine/special/upgrades/ExtraTurnUpgrade";
import { PawnDashDetails } from "../../../engine/special/upgrades/PawnDashUpgrade";


export async function loadOngoingGameHandler(io: Server, socket: GameSocket, payload: LoadOngoingGamePayload, 
            gameEngines: Map<string, IGameEngine>) {
    const parsedPayload = await parseSocketPayload(socket, loadOngoingGameSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, gameId } = parsedPayload;
    console.log("Player ", playerId, " reconnects to ongoing game");

    const engine = gameEngines.get(gameId);

    if (!engine) {
        console.error("❌ No engine found for game", gameId);
        const noOngoingGamePayload: NoOngoingGamePayload = parsedPayload;
        socket.emit(SocketEvent.NO_ONGOING_GAME, noOngoingGamePayload);
        return;
    }

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

    socket.join(gameId);

    const fen = engine.getFen();
    const turnColor = engine.getCurrentPlayer();
    const whiteTime = engine.getWhiteTime();
    const blackTime = engine.getBlackTime();
    const ongoingGameLoadedPayload: OngoingGameLoadedPayload = {
        fen, whiteTime, blackTime, turnColor, validSpecialMovesWithAfterFens,
        turnsBeforeExtra, remainingPawnDashes,
        ...parsedPayload
    };
    socket.emit(SocketEvent.ONGOING_GAME_LOADED, ongoingGameLoadedPayload);
}
