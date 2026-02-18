import { Chess, Color, PieceSymbol, Square, Piece } from "chess.js";
import { IChessVariant, SpecialGameOrchestrator, VariantMoveContext,
    VariantMoveQueryContext, VariantResolutionContext, VariantSetupContext } from "../types";
import { Move } from "../../IGameEngine";
import { SimpleSpecialGameOrchestrator } from "../orchestrators/SimpleSpecialGameOrchestrator";
import { VariantKey } from "@prisma/client";
import { getOpponent } from "../utils";
import { SwissStyleSpecialGameOrchestrator } from "../orchestrators/SwissStyleSpecialGameOrchestrator";


interface CastlingSide {
    rook: string;
    kingTarget: string;
    rookTarget: string;
}

interface CastlingState {
    kingStart: Record<Color, string>;
    rookStarts: Record<
        Color,
        {
            kingSide: string;
            queenSide: string;
        }
    >;
    kingMoved: Record<Color, boolean>;
    rookMoved: Record<Color, Record<string, boolean>>;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export class Chess960Variant implements IChessVariant {
    public readonly key = VariantKey.CHESS960;
    public readonly name = "Chess960";
    public readonly description =
        "Fischer Random Chess with randomized back rank setup and Chess960 castling rules.";
    public readonly minimumCapacity = 2;
    public readonly maximumCapacity = 2;
    public totalRounds = 1;

    private readonly castlingState = new WeakMap<Chess, CastlingState>();

    createOrchestrator(): SpecialGameOrchestrator {
        if (this.totalRounds === 1) {
            return new SimpleSpecialGameOrchestrator();
        }
        return new SwissStyleSpecialGameOrchestrator();
    }

    cloneWithState(sourceChess: Chess, targetChess: Chess): IChessVariant {
        const clone = new Chess960Variant();
        const sourceState = this.castlingState.get(sourceChess);
        if (sourceState) {
            clone.castlingState.set(targetChess, this.cloneCastlingState(sourceState));
        } else {
            clone.castlingState.set(targetChess, clone.deriveCastlingState(targetChess));
        }
        return clone;
    }

    setupBoard(context: VariantSetupContext): void {
        const fen = context.customStartingFen ?? this.generateStartingFen();
        context.chess.load(fen);
        this.castlingState.set(context.chess, this.deriveCastlingState(context.chess));
    }

    getValidSpecialMoves(context: VariantMoveQueryContext): Move[] {
        let validSpecialMoves: Move[] = [];

        if (this.getValidCastlingMoves) {
            validSpecialMoves = validSpecialMoves.concat(this.getValidCastlingMoves(context));
        }

        return validSpecialMoves;
    }

    getValidMoves(context: VariantMoveQueryContext): Move[] {
        let moves: Move[] = context.chess
            .moves({ square: context.from as Square | undefined, verbose: true })
            .map(move => ({
                from: move.from,
                to: move.to,
                promotion: move.promotion as Move["promotion"],
            }));

        const castlingMoves = this.getCastlingMoves(context);
        if (context.from) {
            moves = moves.concat(castlingMoves.filter(move => move.from === context.from));
        } else {
            moves = moves.concat(castlingMoves);
        }

        return moves;
    }

    applyMove(context: VariantMoveContext): boolean {
        const castlingState = this.castlingState.get(context.chess);
        if (!castlingState) return false;

        const color = context.chess.turn();
        const kingStart = castlingState.kingStart[color];

        if (context.move.from === kingStart) {
            const side = this.getCastlingSideByRook(color, castlingState, context.move.to);
            if (side && this.canCastle(color, side, context.chess, castlingState)) {
                return this.applyCastling(context.chess, color, side, castlingState);
            }
        }

        const result = context.chess.move(context.move);
        if (result) {
            this.updateCastlingRightsAfterMove(
                result.from,
                result.to,
                result.piece,
                result.captured,
                castlingState,
                color,
            );
        }
        return !!result;
    }

    isGameOver(context: VariantResolutionContext): boolean {
        return context.chess.isGameOver();
    }

    getWinner(context: VariantResolutionContext): "w" | "b" | null {
        if (!context.chess.isGameOver()) return null;
        if (context.chess.isCheckmate()) {
            return context.chess.turn() === "w" ? "b" : "w";
        }
        return null;
    }

    private getValidCastlingMoves(context: VariantMoveQueryContext): Move[] {
        let castlingMoves = this.getCastlingMoves(context);
        if (context.from) {
            castlingMoves = castlingMoves.filter(move => move.from === context.from);
        }
        return castlingMoves;
    }

    private generateStartingFen(): string {
        const backRank: Array<PieceSymbol | " "> = new Array(8).fill(" ");

        // Place bishops on opposite-colored squares
        const lightSquares = [0, 2, 4, 6];
        const darkSquares = [1, 3, 5, 7];
        const bishopLight = lightSquares[Math.floor(Math.random() * lightSquares.length)];
        const bishopDark = darkSquares[Math.floor(Math.random() * darkSquares.length)];
        backRank[bishopLight] = "b";
        backRank[bishopDark] = "b";

        // Place queen
        const remainingAfterBishops = this.remainingIndices(backRank);
        const queenIndex = remainingAfterBishops[Math.floor(Math.random() * remainingAfterBishops.length)];
        backRank[queenIndex] = "q";

        // Place knights
        for (let i = 0; i < 2; i++) {
            const remaining = this.remainingIndices(backRank);
            const knightIndex = remaining[Math.floor(Math.random() * remaining.length)];
            backRank[knightIndex] = "n";
        }

        // Remaining squares are king and rooks; king must be between rooks
        const lastSquares = this.remainingIndices(backRank).sort((a, b) => a - b);
        const kingSquare = lastSquares[1];
        backRank[kingSquare] = "k";
        backRank[lastSquares[0]] = "r";
        backRank[lastSquares[2]] = "r";

        const whiteBackRank = backRank.map(p => p.toUpperCase()).join("");
        const blackBackRank = backRank.join("");

        return `${blackBackRank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteBackRank} w - - 0 1`;
    }

    private remainingIndices(backRank: Array<PieceSymbol | " ">): number[] {
        const remaining: number[] = [];
        backRank.forEach((piece, idx) => {
            if (piece === " ") remaining.push(idx);
        });
        return remaining;
    }

    private deriveCastlingState(chess: Chess): CastlingState {
        const board = chess.board();
        const rankWhite = board[7];
        const rankBlack = board[0];

        const whiteKing = rankWhite.findIndex(piece => piece?.type === "k");
        const blackKing = rankBlack.findIndex(piece => piece?.type === "k");

        const whiteRooks = rankWhite
            .map((piece, idx) => (piece?.type === "r" ? idx : -1))
            .filter(idx => idx >= 0)
            .sort((a, b) => a - b);
        const blackRooks = rankBlack
            .map((piece, idx) => (piece?.type === "r" ? idx : -1))
            .filter(idx => idx >= 0)
            .sort((a, b) => a - b);

        return {
            kingStart: {
                w: `${FILES[whiteKing]}1`,
                b: `${FILES[blackKing]}8`,
            },
            rookStarts: {
                w: {
                    queenSide: `${FILES[whiteRooks[0]]}1`,
                    kingSide: `${FILES[whiteRooks[1]]}1`,
                },
                b: {
                    queenSide: `${FILES[blackRooks[0]]}8`,
                    kingSide: `${FILES[blackRooks[1]]}8`,
                },
            },
            kingMoved: { w: false, b: false },
            rookMoved: { w: {}, b: {} },
        };
    }

    private getCastlingMoves(context: VariantMoveQueryContext): Move[] {
        const castlingState = this.castlingState.get(context.chess);
        if (!castlingState) return [];

        const color = context.chess.turn();
        const kingStart = castlingState.kingStart[color];

        const kingPiece = context.chess.get(kingStart as Square);
        if (!kingPiece || kingPiece.type !== "k" || kingPiece.color !== color) return [];

        // King must not have moved
        if (castlingState.kingMoved[color]) return [];

        // King must not currently be in check
        if (context.chess.isCheck()) return [];

        // If querying for a specific from-square, it must be the king’s start
        if (context.from && context.from !== kingStart) return [];

        const moves: Move[] = [];
        const sides: Array<"king" | "queen"> = ["king", "queen"];

        for (const s of sides) {
            const side = this.getCastlingSide(color, castlingState, s);
            if (!side) continue;

            if (this.canCastle(color, side, context.chess, castlingState)) {
                moves.push({ from: kingStart, to: side.rook });
            }
        }

        return moves;
    }

    private getCastlingSide(color: Color, state: CastlingState, side: "king" | "queen"): CastlingSide | null {
        const rookStart = side === "king" ? state.rookStarts[color].kingSide : state.rookStarts[color].queenSide;
        const kingTarget = color === "w"
                ? side === "king"
                    ? "g1"
                    : "c1"
                : side === "king"
                    ? "g8"
                    : "c8";
        const rookTarget = color === "w"
                ? side === "king"
                    ? "f1"
                    : "d1"
                : side === "king"
                    ? "f8"
                    : "d8";

        return { rook: rookStart, kingTarget, rookTarget };
    }

    private getCastlingSideByRook(color: Color, state: CastlingState, rookSquare: string): CastlingSide | null {
        const kingSide = this.getCastlingSide(color, state, "king");
        const queenSide = this.getCastlingSide(color, state, "queen");

        if (kingSide && kingSide.rook === rookSquare) return kingSide;
        if (queenSide && queenSide.rook === rookSquare) return queenSide;
        return null;
    }

    private canCastle(color: Color, side: CastlingSide, chess: Chess, state: CastlingState): boolean {
        const kingStart = state.kingStart[color];
        const rookStart = side.rook;

        const kingPiece = chess.get(kingStart as Square);
        const rookPiece = chess.get(rookStart as Square);

        // King and that rook must be unmoved from original squares
        if (!kingPiece || kingPiece.type !== "k" || kingPiece.color !== color) return false;
        if (!rookPiece || rookPiece.type !== "r" || rookPiece.color !== color) return false;
        if (state.kingMoved[color]) return false;
        if (state.rookMoved[color]?.[rookStart]) return false;

        // King must not be currently in check
        if (chess.isCheck()) return false;

        const kingTarget = side.kingTarget;
        const rookTarget = side.rookTarget;

        const involved = [kingStart, rookStart, kingTarget, rookTarget];
        for (const sq of involved) {
            const piece = chess.get(sq as Square);
            if (!piece) continue;

            const isKingStart = sq === kingStart;
            const isRookStart = sq === rookStart;

            const isAllowedKing =
                isKingStart && piece.type === "k" && piece.color === color;
            const isAllowedRook =
                isRookStart && piece.type === "r" && piece.color === color;

            if (!isAllowedKing && !isAllowedRook) {
                return false;
            }
        }

        const fileIndex = (sq: string) => FILES.indexOf(sq[0] as (typeof FILES)[number]);

        const rookPathBetween = this.squaresBetween(rookStart, rookTarget, false);
        for (const sq of rookPathBetween) {
            if (sq === kingStart) continue;
            if (chess.get(sq as Square)) return false;
        }

        const kingPathBetween = this.squaresBetween(kingStart, kingTarget, false);
        for (const sq of kingPathBetween) {
            if (sq === rookStart) continue;
            if (chess.get(sq as Square)) return false;
        }

        const minFile = Math.min(...involved.map(fileIndex));
        const maxFile = Math.max(...involved.map(fileIndex));
        const rank = kingStart[1];

        for (let f = minFile + 1; f < maxFile; f++) {
            const sq = `${FILES[f]}${rank}`;
            if (sq === kingStart || sq === rookStart) continue;
            const piece = chess.get(sq as Square);
            if (piece) return false;
        }

        const opponent = getOpponent(color);
        if (chess.isAttacked(kingTarget as Square, opponent)) return false;

        const kingPathForAttackCheck = this.squaresBetween(kingStart, kingTarget, true);
        for (const sq of kingPathForAttackCheck) {
            if (chess.isAttacked(sq as Square, opponent)) return false;
        }

        return true;
    }

    private squaresBetween(from: string, to: string, inclusiveDestination = false): string[] {
        const fromFile = FILES.indexOf(from[0] as (typeof FILES)[number]);
        const toFile = FILES.indexOf(to[0] as (typeof FILES)[number]);
        const rank = from[1];
        const step = Math.sign(toFile - fromFile);
        const squares: string[] = [];

        for (let file = fromFile + step; file !== toFile; file += step) {
            squares.push(`${FILES[file]}${rank}`);
        }
        if (inclusiveDestination) {
            squares.push(to);
        }
        return squares;
    }

    private applyCastling(chess: Chess, color: Color, side: CastlingSide, state: CastlingState): boolean {
        const kingStartSq = state.kingStart[color];
        const rookStartSq = side.rook;

        const kingPiece = chess.get(kingStartSq as Square);
        const rookPiece = chess.get(rookStartSq as Square);

        if (!kingPiece || kingPiece.type !== "k" || kingPiece.color !== color) return false;
        if (!rookPiece || rookPiece.type !== "r" || rookPiece.color !== color) return false;

        const temp = new Chess(chess.fen());

        temp.remove(kingStartSq as Square);
        temp.remove(rookStartSq as Square);

        temp.put(kingPiece, side.kingTarget as Square);
        temp.put(rookPiece, side.rookTarget as Square);

        let [placement, sideToMove, castling, ep, halfmove, fullmove] = temp.fen().split(" ");

        sideToMove = getOpponent(color);       // opponent to move
        castling = "-";                        // no castling rights after castling
        ep = "-";                              // no en passant
        halfmove = "0";                        // reset halfmove clock

        let fullmoveNumber = Number(fullmove) || 1;
        if (color === "b") {
            fullmoveNumber += 1;
        }
        fullmove = String(fullmoveNumber);

        const newFen = [placement, sideToMove, castling, ep, halfmove, fullmove].join(" ");

        chess.load(newFen);

        // Update our castling state (no further castling)
        state.kingMoved[color] = true;
        state.rookMoved[color][rookStartSq] = true;

        return true;
    }

    private cloneCastlingState(state: CastlingState): CastlingState {
        return {
            kingStart: { ...state.kingStart },
            rookStarts: {
                w: { ...state.rookStarts.w },
                b: { ...state.rookStarts.b },
            },
            kingMoved: { ...state.kingMoved },
            rookMoved: {
                w: { ...state.rookMoved.w },
                b: { ...state.rookMoved.b },
            },
        };
    }

    private updateCastlingRightsAfterMove(from: string, to: string, piece: string,
        captured: string | undefined, state: CastlingState, color: Color) {
        if (piece === "k" && from === state.kingStart[color]) {
            state.kingMoved[color] = true;
        }

        const rookStarts = state.rookStarts[color];
        if (piece === "r") {
            if (from === rookStarts.kingSide || from === rookStarts.queenSide) {
                state.rookMoved[color][from] = true;
            }
        }

        const opponent = getOpponent(color);
        const opponentRooks = state.rookStarts[opponent];
        if (captured === "r") {
            if (to === opponentRooks.kingSide || to === opponentRooks.queenSide) {
                state.rookMoved[opponent][to] = true;
            }
        }
    }
}
