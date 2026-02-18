import { UpgradeKey } from "@prisma/client";
import { AfterMoveChanges, AfterMoveParams, ISpecialUpgrade, MoveLifecycleContext, UpgradeDetails } from "../types";
import { getOpponent } from "../utils";

export class TimeCheckUpgrade implements ISpecialUpgrade {
    public readonly key = UpgradeKey.TIME_CHECK;
    public readonly name = "Time Check";
    public readonly description = "Each time a player moves and checks their opponent,\
                                   they gain extra time on their clock.";

    clone(): ISpecialUpgrade {
        return new TimeCheckUpgrade();
    }

    getUpgradeDetails(): UpgradeDetails {
        return {
            key: this.key,
            name: this.name,
            description: this.description,
        };
    }

    afterMove(context: MoveLifecycleContext, moveApplied: boolean, params: AfterMoveParams): AfterMoveChanges {
        if (!moveApplied) {
            return { fen: undefined, timeMsAdded: 0 };
        }

        const afterMoveChanges: AfterMoveChanges = {
            fen: undefined,
            timeMsAdded: this.lastMoveWasChecking(context) 
                ? this.getTimeCheckBonusMs(params.tcMinutes, params.tcBonus)
                : 0,
        };
        return afterMoveChanges;
    }

    private getTimeCheckBonusMs(tcMinutes: number, tcBonus: number): number {
        const estimatedTime = tcMinutes + (tcBonus * 40) / 60;

        if (estimatedTime < 3)  return Math.max(500, tcBonus * 2000);  // Bullet: 2–8 s
        if (estimatedTime < 10) return Math.max(1000, tcBonus * 3000); // Blitz: 4–12 s
        if (estimatedTime < 60) return Math.max(2000, tcBonus * 4000); // Rapid: 8–20 s

        return Math.max(3000, tcBonus * 6000); // Classic: 12–40 s
    }

    private lastMoveWasChecking(context: MoveLifecycleContext): boolean {
        return context.chess.isCheck();
    }
}
