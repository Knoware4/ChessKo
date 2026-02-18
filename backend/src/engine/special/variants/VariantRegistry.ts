import { VariantKey } from "@prisma/client";
import { IChessVariant } from "../types";
import { Chess960Variant } from "./Chess960Variant";
import { ClassicalVariant } from "./ClassicalVariant";
import { KingOfTheHillVariant } from "./KingOfTheHillVariant";
import { ThreeCheckVariant } from "./ThreeCheckVariant";

export class VariantRegistry {
    private readonly variants: Map<string, IChessVariant> = new Map();

    constructor() {
        const classical = new ClassicalVariant();
        const chess960 = new Chess960Variant();
        const kingOfTheHill = new KingOfTheHillVariant();
        const threeCheck = new ThreeCheckVariant();
        this.register(classical);
        this.register(chess960);
        this.register(kingOfTheHill);
        this.register(threeCheck);
    }

    register(variant: IChessVariant): void {
        this.variants.set(variant.key, variant);
    }

    getVariant(key: VariantKey): IChessVariant | undefined {
        return this.variants.get(key);
    }

    listVariants(): IChessVariant[] {
        return Array.from(this.variants.values());
    }
}
