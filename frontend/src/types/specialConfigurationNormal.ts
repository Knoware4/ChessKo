import { UpgradeKey, VariantKey } from "./enums/enums";


type ObjectWithIdOnly = {
    id: string;
}

export type SpecialConfigurationNormal = ObjectWithIdOnly & {
    name: string;
    variantKey: VariantKey;
    upgradeKeys: UpgradeKey[];
};
