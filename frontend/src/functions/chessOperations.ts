import { socket } from "../socket";
import { SocketEvent } from "../sockets/socketEvents";
import { AcceptDrawPayload, DeclineDrawPayload, MovePayload, OfferDrawPayload, ResignPayload } from "../sockets/socketPayloads";
import { Promotion, UpgradeKey } from "../types/enums/enums";


export function move(from: string, to: string, isFinished: boolean, gameId: string, playerId: string, promotion: Promotion, special?: UpgradeKey, useExtraTurn?: boolean) {
    if (!isFinished) {
        const payload: MovePayload = {
            playerId, from, to, promotion,
            gameId, special, useExtraTurn,
        };
        socket?.emit(SocketEvent.MOVE, payload);
    }
}

export function offerDraw(gameId: string | undefined, playerId: string | undefined, isFinished: boolean) {
    if (gameId && playerId && !isFinished) {
        const payload: OfferDrawPayload = {
            gameId, playerId,
        };
        socket?.emit(SocketEvent.OFFER_DRAW, payload);
    }
}

export function replyOfferDraw(accept: boolean, gameId: string | undefined, playerId: string | undefined, isFinished: boolean, setOfferedDraw: (res: boolean) => void) {
    if (gameId && playerId && !isFinished) {
        const payload: AcceptDrawPayload | DeclineDrawPayload = {
            gameId, playerId,
        };
        if (accept) {
            socket?.emit(SocketEvent.ACCEPT_DRAW, payload);
        }
        else {
            socket?.emit(SocketEvent.DECLINE_DRAW, payload);
        }
    }
    setOfferedDraw(false);
}

export function resign(gameId: string | undefined, playerId: string | undefined, isFinished: boolean) {
    if (gameId && playerId && !isFinished) {
        const payload: ResignPayload = {
            gameId, playerId,
        };
        socket?.emit(SocketEvent.RESIGN, payload);
    }
}
