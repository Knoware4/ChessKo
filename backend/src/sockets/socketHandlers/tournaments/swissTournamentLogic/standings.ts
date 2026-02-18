import { TournamentFinishedPayload } from "../../../socketPayloads";
import { ActiveTournament, PlayerStanding } from "./types";


export function getStanding(tournament: ActiveTournament, playerId: string): PlayerStanding {
    const standing = tournament.standings.get(playerId);
    if (!standing) {
        throw new Error(`Standing for player ${playerId} not found`);
    }
    return standing;
}

export function recomputeBuchholz(tournament: ActiveTournament) {
    for (const player of tournament.players) {
        const standing = getStanding(tournament, player.id);
        let score = 0;
        standing.opponents.forEach(opponentId => {
            const opponentStanding = tournament.standings.get(opponentId);
            if (opponentStanding) {
                score += opponentStanding.score;
            }
        });
        standing.buchholz = score;
    }
}

export function computeMedianBuchholz(standing: PlayerStanding, tournament: ActiveTournament): number {
    const opponentScores = Array.from(standing.opponents)
        .map(id => tournament.standings.get(id)?.score ?? 0)
        .sort((a, b) => a - b);

    if (opponentScores.length <= 2) {
        return opponentScores.reduce((acc, val) => acc + val, 0);
    }

    const trimmed = opponentScores.slice(1, opponentScores.length - 1);
    return trimmed.reduce((acc, val) => acc + val, 0);
}

/**
 * Builds the final leaderboard, applying Swiss tie-breakers:
 *   1. Score
 *   2. Buchholz
 *   3. Median Buchholz
 *   4. Player Elo
 *   5. Player identifier (for deterministic ordering)
 */
export function buildLeaderboard(tournament: ActiveTournament): TournamentFinishedPayload["leaderboard"] {
    return tournament.players.map(player => {
        const standing = getStanding(tournament, player.id);
        return {
            playerId: player.id,
            score: standing.score,
            buchholz: standing.buchholz,
            medianBuchholz: computeMedianBuchholz(standing, tournament),
            elo: player.elo,
            colorHistory: [...standing.colorHistory],
            hasBye: standing.hasBye,
        };
    }).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
        if (b.medianBuchholz !== a.medianBuchholz) return b.medianBuchholz - a.medianBuchholz;
        if (b.elo !== a.elo) return b.elo - a.elo;
        return a.playerId.localeCompare(b.playerId);
    });
}
