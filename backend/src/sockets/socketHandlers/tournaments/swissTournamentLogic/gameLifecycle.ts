import { GameResult } from "@prisma/client";
import { Server } from "socket.io";
import { GameSocket } from "../../../socketHandlers";
import { ActiveTournament } from "./types";
import { getStanding, recomputeBuchholz } from "./standings";
import { handleRoundCompletion } from "./roundLifecycle";
import { IGameEngine } from "../../../../engine/IGameEngine";
import { ActiveSpecialGame } from "../../../../engine/special/types";
import { VariantRegistry } from "../../../../engine/special/variants/VariantRegistry";


export async function handleTournamentGameCompletion(io: Server, tournaments: Map<string, ActiveTournament>,
        tournamentId: string | null | undefined, gameId: string, gameResult: GameResult,
        gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>,
        specialGames: Map<string, ActiveSpecialGame>, variantRegistry: VariantRegistry) {
    if (!tournamentId) return;

    const tournament = tournaments.get(tournamentId);
    if (!tournament || tournament.isFinished) return;

    const matchReference = tournament.matchesByGameId.get(gameId);
    if (!matchReference) {
        console.error(`❌ Tournament match for game ${gameId} not found`);
        return;
    }

    const round = tournament.rounds[matchReference.roundIndex];
    if (!round) {
        console.error(`❌ Round ${matchReference.roundIndex} not found for tournament ${tournamentId}`);
        return;
    }

    const match = round.matches.find(m => m.id === matchReference.matchId);
    if (!match) {
        console.error(`❌ Match ${matchReference.matchId} not found in round ${round.roundNumber}`);
        return;
    }

    if (match.isComplete) {
        console.warn(`⚠️ Match ${match.id} in tournament ${tournamentId} already completed.`);
        return;
    }

    match.result = gameResult;
    match.isComplete = true;

    if (match.whitePlayerId && match.blackPlayerId) {
        const whiteStanding = getStanding(tournament, match.whitePlayerId);
        const blackStanding = getStanding(tournament, match.blackPlayerId);

        if (gameResult === GameResult.WHITE) {
            match.winnerId = match.whitePlayerId ?? undefined;
            whiteStanding.score += 1;
        } else if (gameResult === GameResult.BLACK) {
            match.winnerId = match.blackPlayerId ?? undefined;
            blackStanding.score += 1;
        } else {
            match.winnerId = undefined;
            whiteStanding.score += 0.5;
            blackStanding.score += 0.5;
        }
    }

    tournament.matchesByGameId.delete(gameId);
    recomputeBuchholz(tournament);

    if (round.matches.every(m => m.isComplete)) {
        await handleRoundCompletion(tournament, io, gameEngines, socketsByPlayerId,
                                    tournaments, specialGames, variantRegistry);
    }
}
