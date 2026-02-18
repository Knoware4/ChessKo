import { Color } from "@prisma/client";
import { ActiveTournament, TournamentPlayer } from "./types";
import { getStanding } from "./standings";


export function assignColors(playerA: TournamentPlayer, playerB: TournamentPlayer,
    tournament: ActiveTournament) {
    const idToPlayer = new Map<string, TournamentPlayer>([
        [playerA.id, playerA],
        [playerB.id, playerB],
    ]);

    const evaluate = (whiteId: string, blackId: string) => {
        const whiteStanding = getStanding(tournament, whiteId);
        const blackStanding = getStanding(tournament, blackId);

        const projectedWhiteCount = whiteStanding.whiteCount + 1;
        const projectedWhiteImbalance = projectedWhiteCount - whiteStanding.blackCount;
        const projectedBlackCount = blackStanding.blackCount + 1;
        const projectedBlackImbalance = blackStanding.whiteCount - projectedBlackCount;

        const imbalancePenalty = Math.max(0, Math.abs(projectedWhiteImbalance) - 1)
            + Math.max(0, Math.abs(projectedBlackImbalance) - 1);
        const totalImbalance = Math.abs(projectedWhiteImbalance) + Math.abs(projectedBlackImbalance);
        const combinedImbalance = Math.abs(projectedWhiteImbalance + projectedBlackImbalance);

        const alternationScore = (whiteStanding.lastColor === Color.WHITE ? 0 : 1)
            + (blackStanding.lastColor === Color.BLACK ? 0 : 1);

        return {
            imbalancePenalty,
            alternationScore,
            combinedImbalance,
            totalImbalance,
            whiteId,
            blackId,
        };
    };

    const option1 = evaluate(playerA.id, playerB.id);
    const option2 = evaluate(playerB.id, playerA.id);

    const candidates = [option1, option2];

    candidates.sort((a, b) => {
        if (a.imbalancePenalty !== b.imbalancePenalty) {
            return a.imbalancePenalty - b.imbalancePenalty;
        }
        if (a.alternationScore !== b.alternationScore) {
            return b.alternationScore - a.alternationScore;
        }
        if (a.combinedImbalance !== b.combinedImbalance) {
            return a.combinedImbalance - b.combinedImbalance;
        }
        if (a.totalImbalance !== b.totalImbalance) {
            return a.totalImbalance - b.totalImbalance;
        }
        return 0;
    });

    const chosen = candidates[0];

    const whiteStanding = getStanding(tournament, chosen.whiteId);
    const blackStanding = getStanding(tournament, chosen.blackId);

    whiteStanding.whiteCount += 1;
    whiteStanding.lastColor = Color.WHITE;
    whiteStanding.colorHistory.push(Color.WHITE);

    blackStanding.blackCount += 1;
    blackStanding.lastColor = Color.BLACK;
    blackStanding.colorHistory.push(Color.BLACK);

    const whiteImbalance = whiteStanding.whiteCount - whiteStanding.blackCount;
    const blackImbalance = blackStanding.whiteCount - blackStanding.blackCount;

    if (Math.abs(whiteImbalance) > 1 || Math.abs(blackImbalance) > 1) {
        console.warn(`⚠️ Unable to keep color imbalance within ±1 for pairing ${chosen.whiteId} vs ${chosen.blackId}.`);
    }

    const white = idToPlayer.get(chosen.whiteId)!;
    const black = idToPlayer.get(chosen.blackId)!;

    return { white, black };
}
