import { MatchType, VariantKey } from "../enums/enums";


export interface SpecialChessForm {
    name: string,
    tcMinutes: number,
    tcBonus: number,
    matchType: MatchType,
    variantKey: VariantKey,
    timeCheck: boolean,
    extraTurn: boolean,
    pawnDash: boolean,
    jumpOver: boolean,
}
