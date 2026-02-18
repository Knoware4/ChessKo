import { UpgradeKey } from "@prisma/client";
import { AfterMoveChanges, AfterMoveParams, ISpecialUpgrade, MoveLifecycleContext, UpgradeDetails } from "../types";
import { Chess } from "chess.js";
import { getOpponent } from "../utils";


export interface ExtraTurnDetails extends UpgradeDetails {
    turnsBeforeExtra: { w: number; b: number };
}

export class ExtraTurnUpgrade implements ISpecialUpgrade {
    public readonly key = UpgradeKey.EXTRA_TURN;
    public readonly name = "Extra Turn";
    public readonly description = "If charged, grants an extra move immediately after this\
                                   one unless the move results in checkmate or stalemate.";
    private turnsUntilCharged: { w: number; b: number };

    constructor(turnsUntilCharged?: { w: number; b: number }) {
        this.turnsUntilCharged = turnsUntilCharged ?? { w: 0, b: 0 };
    }

    clone(): ISpecialUpgrade {
        return new ExtraTurnUpgrade({
            w: this.turnsUntilCharged.w,
            b: this.turnsUntilCharged.b,
        });
    }

    getUpgradeDetails(): ExtraTurnDetails {
        return {
            key: this.key,
            name: this.name,
            description: this.description,
            turnsBeforeExtra: {
                w: this.turnsUntilCharged.w,
                b: this.turnsUntilCharged.b,
            },
        };
    }

    afterMove(context: MoveLifecycleContext, moveApplied: boolean, params: AfterMoveParams): AfterMoveChanges {
        const afterMoveChanges: AfterMoveChanges = {
            fen: undefined,
            timeMsAdded: 0,
        };
        if (!moveApplied) return afterMoveChanges;

        const movingColor = getOpponent(context.chess.turn());
        if (this.turnsUntilCharged[movingColor] > 0) {
            this.turnsUntilCharged[movingColor] -= 1;
        }
        else if (!this.lastMoveWasChecking(context) && params.extraTurn && !context.chess.isGameOver()) {
            afterMoveChanges.fen = this.getExtraTurnFen(context);
            this.turnsUntilCharged[movingColor] = 10;
        }
        afterMoveChanges.turnsBeforeExtra = this.turnsUntilCharged[movingColor];
        return afterMoveChanges;
    }

    private getExtraTurnFen(context: MoveLifecycleContext): string {
        const chessCopy = new Chess(context.chess.fen());
        const movingColor = chessCopy.turn();

        const fenParts = chessCopy.fen().split(" ");
        // 0: piece placement, 1: side, 2: castling, 3: ep, 4: halfmove, 5: fullmove
        fenParts[1] = getOpponent(movingColor);
        const newFen = fenParts.join(" ");

        return newFen;
    }

    private lastMoveWasChecking(context: MoveLifecycleContext): boolean {
        return context.chess.isCheck()
    }
}
