import { GameMode, GameResult, TimeControl } from "@prisma/client";
import { ActiveSpecialGame, SpecialGamePlayerStanding } from "../types";
import { calculateElo } from "../../../utils";
import { PatchPlayerData } from "../../../player/types";
import { SpecialGameFinishedPayload } from "../../../sockets/socketPayloads";


export function recomputateEloAfterSpecialGame(specialGame: ActiveSpecialGame):
        Map<string, { initial: number; current: number }> {
    const ratingSnapshots = new Map<string, { initial: number; current: number }>();
    for (const player of specialGame.players) {
        ratingSnapshots.set(player.id, { initial: player.elo, current: player.elo });
    }

    for (const round of specialGame.rounds) {
        for (const match of round.matches) {
            if (match.isBye) continue;

            const whiteId = match.whitePlayerId;
            const blackId = match.blackPlayerId;
            if (!whiteId || !blackId) {
                continue;
            }

            const whiteState = ratingSnapshots.get(whiteId);
            const blackState = ratingSnapshots.get(blackId);
            if (!whiteState || !blackState) {
                console.warn(`⚠️ Missing rating snapshot for players ${whiteId} or ${blackId}.`);
                continue;
            }

            let scoreWhite: number | undefined;
            if (match.result === GameResult.WHITE) {
                scoreWhite = 1;
            }
            else if (match.result === GameResult.BLACK) {
                scoreWhite = 0;
            }
            else {  // DRAW
                scoreWhite = 0.5;
            }

            if (typeof scoreWhite === "undefined") {
                console.warn(`⚠️ Missing result for match ${match.id} in round ${round.roundNumber}; skipping Elo update.`);
                continue;
            }

            const scoreBlack = 1 - scoreWhite;
            const { whiteEloAfter, blackEloAfter } = calculateElo(
                whiteState.initial,
                blackState.initial,
                scoreWhite,
                scoreBlack,
            );

            const whiteEloDiff = whiteEloAfter - whiteState.initial;
            const blackEloDiff = blackEloAfter - blackState.initial;

            whiteState.current += whiteEloDiff;
            blackState.current += blackEloDiff;
        }
    }

    return ratingSnapshots;
}

export const buildEloPatch = (gameMode: GameMode, timeControl: TimeControl, newElo: number): PatchPlayerData => {
    if (gameMode === GameMode.CLASSIC) {
        switch (timeControl) {
            case TimeControl.BULLET:
                return { eloRankedBullet: newElo };
            case TimeControl.BLITZ:
                return { eloRankedBlitz: newElo };
            case TimeControl.RAPID:
                return { eloRankedRapid: newElo };
            default:
                return { eloRankedClassic: newElo };
        }
    }

    switch (timeControl) {
        case TimeControl.BULLET:
            return { eloSpecialBullet: newElo };
        case TimeControl.BLITZ:
            return { eloSpecialBlitz: newElo };
        case TimeControl.RAPID:
            return { eloSpecialRapid: newElo };
        default:
            return { eloSpecialClassic: newElo };
    }
};

export function getStanding(specialGame: ActiveSpecialGame, playerId: string): SpecialGamePlayerStanding {
    const standing = specialGame.standings.get(playerId);
    if (!standing) {
        throw new Error(`Standing for player ${playerId} not found`);
    }
    return standing;
}

export function buildLeaderboard(specialGame: ActiveSpecialGame): SpecialGameFinishedPayload["leaderboard"] {
    return specialGame.players.map(player => {
        const standing = getStanding(specialGame, player.id);
        return {
            playerId: player.id,
            score: standing.score,
            elo: player.elo,
            colorHistory: [...standing.colorHistory],
            hasBye: standing.hasBye,
        };
    }).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.elo !== a.elo) return b.elo - a.elo;
        return a.playerId.localeCompare(b.playerId);
    });
}
