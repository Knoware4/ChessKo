import { UpgradeKey } from "@prisma/client";
import { ISpecialUpgrade, MoveLifecycleContext, SpecialChessContext, UpgradeDetails } from "../types";
import { Move } from "../../IGameEngine";
import { Chess, Square } from "chess.js";

export class JumpOverUpgrade implements ISpecialUpgrade {
    public readonly key = UpgradeKey.JUMP_OVER;
    public readonly name = "Jump Over";
    public readonly description = "Allows queen, rook, and bishop to jump over a single friendly\
                                   piece to the square immediately beyond if empty.";

    clone(): ISpecialUpgrade {
        return new JumpOverUpgrade();
    }

    getUpgradeDetails(): UpgradeDetails {
        return {
            key: this.key,
            name: this.name,
            description: this.description,
        };
    }

    modifyValidMoves(context: SpecialChessContext, moves: Move[], from?: string): Move[] {
        const chess = context.chess;
        const sideToMove = chess.turn();
        const extraMoves: Move[] = [];

        if (from) {
            this.addJumpMovesFromSquare(context, moves, extraMoves, from);
        } else {
            const board = chess.board();
            for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
                for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
                    const piece = board[rankIndex][fileIndex];
                    if (!piece || piece.color !== sideToMove) continue;
                    if (piece.type !== "q" && piece.type !== "r" && piece.type !== "b") continue;

                    const fileChar = String.fromCharCode("a".charCodeAt(0) + fileIndex);
                    const rankChar = (8 - rankIndex).toString();
                    const square = `${fileChar}${rankChar}`;

                    this.addJumpMovesFromSquare(context, moves, extraMoves, square);
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
        const currentHalfmove = parseInt(halfmove, 10) || 0;
        const currentFullmove = parseInt(fullmove, 10) || 1;

        const temp = new Chess(originalFen);
        const tempPiece = temp.get(from);
        if (!tempPiece) return move;

        temp.remove(from);
        temp.put(tempPiece, to);

        if (temp.isCheck()) {
            return move;
        }

        const tempPlacement = temp.fen().split(" ")[0];

        const nextSide = side === "w" ? "b" : "w";
        const newHalfmove = currentHalfmove + 1;
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

    private addJumpMovesFromSquare(context: SpecialChessContext, moves: Move[],
            extraMoves: Move[], square: string): void {
        const chess = context.chess;
        const piece = chess.get(square as Square);
        if (!piece) return;

        const sideToMove = chess.turn();
        if (piece.color !== sideToMove) return;
        if (piece.type !== "q" && piece.type !== "r" && piece.type !== "b") return;

        const fromFile = square.charCodeAt(0) - "a".charCodeAt(0);
        const fromRank = Number(square[1]) - 1;

        const directions: Array<[number, number]> = [];

        // Rook-like directions
        if (piece.type === "r" || piece.type === "q") {
            directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
        }
        // Bishop-like directions
        if (piece.type === "b" || piece.type === "q") {
            directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        }

        for (const [df, dr] of directions) {
            let f = fromFile;
            let r = fromRank;
            let encounteredFriendly = false;

            while (true) {
                f += df;
                r += dr;

                if (f < 0 || f > 7 || r < 0 || r > 7) {
                    break;
                }

                const targetFileChar = String.fromCharCode("a".charCodeAt(0) + f);
                const targetRankChar = (r + 1).toString();
                const targetSquare = `${targetFileChar}${targetRankChar}` as Square;
                const targetPiece = chess.get(targetSquare);

                if (!encounteredFriendly) {
                    if (!targetPiece) continue;
                    if (targetPiece.color !== sideToMove) break;

                    encounteredFriendly = true;
                    continue;
                } else {
                    if (targetPiece) break;

                    const exists = moves.some(
                        m => m.from === square && m.to === targetSquare,
                    );

                    if (!exists) {
                        const temp = new Chess(chess.fen());
                        const tempPiece = temp.get(square as Square);
                        if (!tempPiece) break;

                        temp.remove(square as Square);
                        temp.put(tempPiece, targetSquare);

                        if (!temp.isCheck()) {
                            extraMoves.push({
                                from: square,
                                to: targetSquare,
                                promotion: undefined,
                                special: this.key,
                            });
                        }
                    }
                    break;
                }
            }
        }
    }
}
