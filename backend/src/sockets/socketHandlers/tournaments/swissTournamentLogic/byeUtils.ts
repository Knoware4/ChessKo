import { randomUUID } from "node:crypto";
import { Server } from "socket.io";
import { SocketEvent } from "../../../socketEvents";
import { TournamentPairingPayload, TournamentPlayerByePayload } from "../../../socketPayloads";
import { TournamentMatch, TournamentPlayer, ActiveTournament, TournamentRound } from "./types";
import { getStanding } from "./standings";


export function selectByeCandidate(players: TournamentPlayer[], tournament: ActiveTournament): TournamentPlayer | undefined {
    const pickCandidate = (predicate: (standing: ReturnType<typeof getStanding>) => boolean) => {
        let fallback: { index: number; player: TournamentPlayer } | undefined;

        for (let i = players.length - 1; i >= 0; i--) {
            const player = players[i];
            const standing = getStanding(tournament, player.id);

            if (!predicate(standing)) {
                continue;
            }

            if (!fallback) {
                fallback = { index: i, player };
            }

            const history = standing.colorHistory;
            if (history.length >= 2
                && history[history.length - 1] === history[history.length - 2]) {
                return { index: i, player };
            }
        }

        return fallback;
    };

    const preferred = pickCandidate(standing => !standing.hasBye);
    const candidate = preferred ?? pickCandidate(() => true);

    if (!candidate) {
        return undefined;
    }

    players.splice(candidate.index, 1);
    return candidate.player;
}

export function registerBye(
    io: Server,
    tournament: ActiveTournament,
    round: TournamentRound,
    roundNumber: number,
    byePlayer: TournamentPlayer,
    pairingsPayload: TournamentPairingPayload[],
) {
    const standing = getStanding(tournament, byePlayer.id);
    standing.score += 1;
    standing.hasBye = true;
    standing.buchholz += 0; // Byes count as an opponent with zero points for Buchholz.

    const matchId = randomUUID();
    const byeMatch: TournamentMatch = {
        id: matchId,
        roundNumber,
        whitePlayerId: byePlayer.id,
        blackPlayerId: null,
        isBye: true,
        winnerId: byePlayer.id,
        isComplete: true,
    };

    round.matches.push(byeMatch);
    pairingsPayload.push({
        matchId,
        whitePlayerId: byePlayer.id,
        blackPlayerId: null,
        isBye: true,
    });

    io.to(tournament.id).emit(SocketEvent.TOURNAMENT_PLAYER_BYE, {
        tournamentId: tournament.id,
        roundNumber,
        playerId: byePlayer.id,
    } satisfies TournamentPlayerByePayload);
}
