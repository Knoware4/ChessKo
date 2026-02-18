import { ISpecialUpgrade } from "../types";
import { ExtraTurnUpgrade } from "./ExtraTurnUpgrade";
import { JumpOverUpgrade } from "./JumpOverUpgrade";
import { PawnDashUpgrade } from "./PawnDashUpgrade";
import { TimeCheckUpgrade } from "./TimeCheckUpgrade";

export class UpgradeRegistry {
    private readonly upgrades: Map<string, ISpecialUpgrade> = new Map();

    constructor() {
        const timeCheckUpgrade = new TimeCheckUpgrade();
        const extraTurnUpgrade = new ExtraTurnUpgrade();
        const pawnDashUpgrade = new PawnDashUpgrade();
        const jumpOverUpgrade = new JumpOverUpgrade();
        this.register(timeCheckUpgrade);
        this.register(extraTurnUpgrade);
        this.register(pawnDashUpgrade);
        this.register(jumpOverUpgrade);
    }

    register(upgrade: ISpecialUpgrade): void {
        this.upgrades.set(upgrade.key, upgrade);
    }

    getUpgrade(key: string, options?: Record<string, unknown>): ISpecialUpgrade | undefined {
        const upgrade = this.upgrades.get(key)?.clone();
        return upgrade;
    }

    listUpgrades(): ISpecialUpgrade[] {
        return Array.from(this.upgrades.values()).map(upgrade => upgrade.clone());
    }
}
