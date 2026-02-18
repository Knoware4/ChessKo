import { Chess, Square } from "chess.js";
import { IChessVariant, SpecialGameOrchestrator, VariantMoveContext, VariantMoveQueryContext,
    VariantResolutionContext, VariantSetupContext } from "../types";
import { Move } from "../../IGameEngine";
import { SimpleSpecialGameOrchestrator } from "../orchestrators/SimpleSpecialGameOrchestrator";
import { VariantKey } from "@prisma/client";
import { SwissStyleSpecialGameOrchestrator } from "../orchestrators/SwissStyleSpecialGameOrchestrator";


const HILL_SQUARES: Square[] = ["d4", "e4", "d5", "e5"];

export class KingOfTheHillVariant implements IChessVariant {
    public readonly key = VariantKey.KING_OF_THE_HILL;
    public readonly name = "King of the Hill";
    public readonly description = "Standard chess rules with an extra win condition: reach the\
                                   central squares (d4, e4, d5, e5) with your king.";
    public readonly minimumCapacity = 2;
    public readonly maximumCapacity = 2;
    public totalRounds = 1;

    createOrchestrator(): SpecialGameOrchestrator {
        if (this.totalRounds === 1) {
            return new SimpleSpecialGameOrchestrator();
        }
        return new SwissStyleSpecialGameOrchestrator();
    }

    setupBoard(context: VariantSetupContext): void {
        const fen = context.customStartingFen;
        context.chess.reset();
        if (fen) {
            context.chess.load(fen);
        }
    }

    getValidMoves(context: VariantMoveQueryContext): Move[] {
        const moves = context.chess.moves({ square: context.from as Square | undefined, verbose: true });
        return moves.map(move => ({
            from: move.from,
            to: move.to,
            promotion: move.promotion as Move["promotion"],
        }));
    }

    applyMove(context: VariantMoveContext): boolean {
        const result = context.chess.move(context.move);
        return !!result;
    }

    isGameOver(context: VariantResolutionContext): boolean {
        if (this.getHillWinner(context.chess)) {
            return true;
        }
        return context.chess.isGameOver();
    }

    getWinner(context: VariantResolutionContext): "w" | "b" | null {
        const hillWinner = this.getHillWinner(context.chess);
        if (hillWinner) {
            return hillWinner;
        }

        if (!context.chess.isGameOver()) return null;
        if (context.chess.isCheckmate()) {
            return context.chess.turn() === "w" ? "b" : "w";
        }
        return null;
    }

    private getHillWinner(chess: Chess): "w" | "b" | null {
        for (const square of HILL_SQUARES) {
            const piece = chess.get(square);
            if (piece && piece.type === "k") {
                return piece.color;
            }
        }
        return null;
    }

    cloneWithState(sourceChess: Chess, targetChess: Chess): IChessVariant {
        return new KingOfTheHillVariant();
    }
}
