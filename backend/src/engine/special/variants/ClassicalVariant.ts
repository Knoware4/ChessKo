import { Chess, Square } from "chess.js";
import { IChessVariant, SpecialGameOrchestrator, VariantMoveContext, VariantMoveQueryContext,
    VariantResolutionContext, VariantSetupContext } from "../types";
import { Move } from "../../IGameEngine";
import { SimpleSpecialGameOrchestrator } from "../orchestrators/SimpleSpecialGameOrchestrator";
import { VariantKey } from "@prisma/client";
import { SwissStyleSpecialGameOrchestrator } from "../orchestrators/SwissStyleSpecialGameOrchestrator";


export class ClassicalVariant implements IChessVariant {
    public readonly key = VariantKey.CLASSICAL;
    public readonly name = "Classical Chess";
    public readonly description = "Standard chess rules with traditional starting position.";
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
        return context.chess.isGameOver();
    }

    getWinner(context: VariantResolutionContext): "w" | "b" | null {
        if (!context.chess.isGameOver()) return null;
        if (context.chess.isCheckmate()) {
            return context.chess.turn() === "w" ? "b" : "w";
        }
        return null;
    }

    cloneWithState(sourceChess: Chess, targetChess: Chess): IChessVariant {
        return new ClassicalVariant();
    }
}
