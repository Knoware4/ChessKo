import { UpgradeKey } from "@prisma/client";
import { AfterMoveChanges, AfterMoveParams, ISpecialUpgrade, MoveLifecycleContext, SpecialChessContext, UpgradeDetails } from "../types";
import { Move } from "../../IGameEngine";
import { Chess, Square } from "chess.js";
import { getOpponent } from "../utils";


const MAX_DASHES = 3;

export interface PawnDashDetails extends UpgradeDetails {
    remainingDashes: { w: number; b: number };
}

export class PawnDashUpgrade implements ISpecialUpgrade {
    public readonly key = UpgradeKey.PAWN_DASH;
    public readonly name = "Pawn Dash";
    public readonly description = "Allows a pawn to move two squares forward from any position on\
                                   the board three times a game.";
    private remainingDashes: { w: number; b: number };

    constructor(turnsUntilCharged?: { w: number; b: number }) {
        this.remainingDashes = turnsUntilCharged ?? {
            w: MAX_DASHES,
            b: MAX_DASHES,
        };
    }

    clone(): ISpecialUpgrade {
        return new PawnDashUpgrade({
            w: this.remainingDashes.w,
            b: this.remainingDashes.b,
        });
    }

    getUpgradeDetails(): PawnDashDetails {
        return {
            key: this.key,
            name: this.name,
            description: this.description,
            remainingDashes: {
                w: this.remainingDashes.w,
                b: this.remainingDashes.b,
            },
        };
    }

    modifyValidMoves(context: SpecialChessContext, moves: Move[], from?: string): Move[] {
        const extraMoves: Move[] = [];
        const chess = context.chess;
        const sideToMove = chess.turn();

        if (this.remainingDashes[sideToMove] <= 0) {
            return moves;
        }

        if (from) {
            this.tryDashFromSquare(context, moves, extraMoves, from);
        } else {
            const board = chess.board();

            for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
                for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
                    const piece = board[rankIndex][fileIndex];
                    if (!piece || piece.type !== "p" || piece.color !== sideToMove) continue;

                    const fileChar = String.fromCharCode("a".charCodeAt(0) + fileIndex);
                    const rankChar = (8 - rankIndex).toString();
                    const square = `${fileChar}${rankChar}`;

                    this.tryDashFromSquare(context, moves, extraMoves, square);
                }
            }
        }

        return moves.concat(extraMoves);
    }

    beforeMove(context: MoveLifecycleContext): Move | null {
        const chess = context.chess;
        const move = context.move;

        if (move.special !== this.key) {
            return move;
        }

        const sideToMove = chess.turn();
        if (this.remainingDashes[sideToMove] <= 0) {
            return move;
        }

        const specialsFromSquare = this.modifyValidMoves({ ...context }, [], move.from);
        const isStillValid = specialsFromSquare.some(
            m => m.from === move.from && m.to === move.to && m.special === this.key,
        );

        if (!isStillValid) {
            return move;
        }

        const from = move.from as Square;
        const to = move.to as Square;

        const originalFen = chess.fen();
        let [placement, side, castling, ep, halfmove, fullmove] = originalFen.split(" ");
        const currentCastling = castling;
        const currentFullmove = parseInt(fullmove, 10) || 1;

        const temp = new Chess(originalFen);
        const tempPiece = temp.get(from);
        if (!tempPiece) {
            return move;
        }

        temp.remove(from);
        temp.put(tempPiece, to);

        if (temp.isCheck()) {
            return move;
        }

        const tempPlacement = temp.fen().split(" ")[0];

        const nextSide = side === "w" ? "b" : "w";
        const newHalfmove = 0;
        let newFullmove = currentFullmove;

        if (side === "b") {
            newFullmove = currentFullmove + 1;
        }

        const newFen = [
            tempPlacement,
            nextSide,
            currentCastling,
            "-",
            String(newHalfmove),
            String(newFullmove),
        ].join(" ");

        chess.load(newFen);

        const upgradedMove: Move = {
            ...move,
            handledByUpgrade: true,
        };

        return upgradedMove;
    }

    afterMove(context: MoveLifecycleContext, moveApplied: boolean, params: AfterMoveParams): AfterMoveChanges {
        const afterMoveChanges: AfterMoveChanges = {
            fen: undefined,
            timeMsAdded: 0,
        };
        const move = context.move;
        if (!moveApplied || move.special !== this.key) return afterMoveChanges;

        const movingColor = getOpponent(context.chess.turn());
        if (this.remainingDashes[movingColor] <= 0) {
            return afterMoveChanges;
        }

        this.remainingDashes[movingColor] -= 1;
        return afterMoveChanges;
    }

    private tryDashFromSquare(context: SpecialChessContext, moves: Move[],
            extraMoves: Move[], square: string): void {
        const chess = context.chess;
        const sideToMove = chess.turn();
        const piece = chess.get(square as Square);

        if (!piece || piece.type !== "p" || piece.color !== sideToMove) return;

        const file = square[0];
        const rank = Number(square[1]);

        const startingRank = piece.color === "w" ? 2 : 7;
        if (rank === startingRank) return;

        const dir = sideToMove === "w" ? 1 : -1;
        const midRank = rank + dir;
        const targetRank = rank + 2 * dir;

        if (targetRank < 1 || targetRank > 8) return;

        const midSquare = `${file}${midRank}` as Square;
        const targetSquare = `${file}${targetRank}` as Square;

        if (chess.get(midSquare) || chess.get(targetSquare)) return;

        if (targetRank === 1 || targetRank === 8) return;

        const exists = moves.some(m => m.from === square && m.to === targetSquare);
        if (exists) return;

        const temp = new Chess(chess.fen());
        const tempPiece = temp.get(square as Square);
        if (!tempPiece) return;

        temp.remove(square as Square);
        temp.put(tempPiece, targetSquare);

        if (temp.isCheck()) {
            return;
        }

        extraMoves.push({
            from: square,
            to: targetSquare,
            promotion: undefined,
            special: this.key,
        });
    }
}
