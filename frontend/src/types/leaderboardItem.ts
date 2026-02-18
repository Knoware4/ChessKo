export interface LeaderboardItem {
    id: string,
    player: {
        id: string
        nickname: string,
        eloRankedBlitz: number,
        eloSpecialBlitz: number,
        eloRankedBullet: number,
        eloSpecialBullet: number,
        eloRankedRapid: number,
        eloSpecialRapid: number,
        eloRankedClassic: number,
        eloSpecialClassic: number,
        eloRankedUnlimited: number,
        eloSpecialUnlimited: number,
    },
    resultIndex: number,
    roundIndex: number,
    score: number,
};
