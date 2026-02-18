import { Chess, Square, Move as ChessJsVerboseMove } from "chess.js";
import { IChessVariant, SpecialGameOrchestrator, VariantMoveContext,
    VariantMoveQueryContext, VariantResolutionContext, VariantSetupContext,
} from "../types";
import { Move } from "../../IGameEngine";
import { VariantKey } from "@prisma/client";
import { SimpleSpecialGameOrchestrator } from "../orchestrators/SimpleSpecialGameOrchestrator";
import { SwissStyleSpecialGameOrchestrator } from "../orchestrators/SwissStyleSpecialGameOrchestrator";


export class ThreeCheckVariant implements IChessVariant {
    public readonly key = VariantKey.THREE_CHECK;
    public readonly name = "Three-check";
    public readonly description =
        "Standard chess rules with an added victory condition: deliver three checks to win.";
    public readonly minimumCapacity = 2;
    public readonly maximumCapacity = 2;
    public totalRounds = 1;

    private checkState: { w: number; b: number };


    constructor(checkState?: { w: number; b: number }) {
        this.checkState = checkState ? { ...checkState } : { w: 0, b: 0 };
    }

    createOrchestrator(): SpecialGameOrchestrator {
        if (this.totalRounds === 1) {
            return new SimpleSpecialGameOrchestrator();
        }
        return new SwissStyleSpecialGameOrchestrator();
    }

    setupBoard(context: VariantSetupContext): void {
        this.checkState = { w: 0, b: 0 };
        const fen = context.customStartingFen;
        context.chess.reset();
        if (fen) {
            context.chess.load(fen);
        }
    }

    getValidMoves(context: VariantMoveQueryContext): Move[] {
        const moves = context.chess.moves({
            square: context.from as Square | undefined,
            verbose: true,
        }) as ChessJsVerboseMove[];

        return moves.map(move => ({
            from: move.from,
            to: move.to,
            promotion: move.promotion as Move["promotion"],
        }));
    }

    applyMove(context: VariantMoveContext): boolean {
        const result = context.chess.move(context.move);
        if (result && this.isCheckingMove(result)) {
            this.checkState[result.color as "w" | "b"] += 1;
        }
        return !!result;
    }

    isGameOver(context: VariantResolutionContext): boolean {
        if (this.checkState.w >= 3 || this.checkState.b >= 3) {
            return true;
        }
        return context.chess.isGameOver();
    }

    getWinner(context: VariantResolutionContext): "w" | "b" | null {
        if (this.checkState.w >= 3) return "w";
        if (this.checkState.b >= 3) return "b";

        if (!context.chess.isGameOver()) return null;
        if (context.chess.isCheckmate()) {
            return context.chess.turn() === "w" ? "b" : "w";
        }
        return null;
    }

    private isCheckingMove(move: { san: string }): boolean {
        return move.san.includes("+") || move.san.includes("#");
    }

    cloneWithState(_sourceChess: Chess, _targetChess: Chess): IChessVariant {
        return new ThreeCheckVariant(this.checkState);
    }
}
