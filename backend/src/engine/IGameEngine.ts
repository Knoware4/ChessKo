import { Color } from "chess.js";
import { ValidSpecialMoveWithAfterFen } from "../sockets/socketPayloads";
import { UpgradeKey } from "@prisma/client";
import { UpgradeDetails } from "./special/types";

export interface Move {
    from: string;                         // e.g. "e2"
    to: string;                           // e.g. "e4"
    promotion?: "q" | "r" | "b" | "n";    // optional promotion piece
    special?: UpgradeKey;                 // optional special move identifier
    handledByUpgrade?: boolean;           // internal flag to indicate if move was modified by an upgrade
}

export interface SpecialParams {
    useExtraTurn?: boolean;
}

export interface IGameEngine {
    getValidMoves(from?: string): Move[];
    getValidSpecialMovesWithAfterFens?(from?: string): ValidSpecialMoveWithAfterFen[];
    getUpgradesDetails?(upgradeKey?: UpgradeKey): Map<UpgradeKey, UpgradeDetails>;
    makeMove(move: Move, specialParams?: SpecialParams): boolean;
    isValidMove(move: Move): boolean;
    isGameOver(): boolean;
    getWinner(): "w" | "b" | null;
    getWinnerId(): string | undefined;
    reset(fen?: string): void;
    offerDraw(color: Color): void;
    declineDraw(color: Color): void;
    isOfferedDraw(color: Color): boolean;
    dispose(): void;
    getWhiteTime(): number;
    getBlackTime(): number;
    getCurrentPlayer(): Color;
    getFen(): string;
    getPgn(): string;
    canUndo(): boolean;
    undo(): string | undefined;
}
