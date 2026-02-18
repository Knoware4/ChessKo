import { randomUUID } from "node:crypto";
import { Server } from "socket.io";
import { ClassicChessEngine, ClassicChessEngineParams } from "../../../../engine/ClassicChessEngine";
import { gameRepository } from "../../../../game/repository/gameRepository";
import { playerRepository } from "../../../../player/repository/playerRepository";
import { tournamentRepository } from "../../../../tournament/repository/tournamentRepository";
import { SocketEvent } from "../../../socketEvents";
import { TournamentFinishedPayload, TournamentGameStartedPayload, TournamentPairingPayload, 
    TournamentRoundStartedPayload } from "../../../socketPayloads";
import { GameSocket } from "../../../socketHandlers";
import { timeoutHandler } from "../../game/timeoutHandler";
import { assignColors } from "./colorAssignment";
import { registerBye, selectByeCandidate } from "./byeUtils";
import { buildLeaderboard, getStanding, recomputeBuchholz } from "./standings";
import { ActiveTournament, TournamentLeaderboardDbEntry, TournamentMatch, TournamentRound } from "./types";
import { GameMode, GameResult, GameStatus, MatchType, TimeControl } from "@prisma/client";
import { NewGameData, PatchGameData } from "../../../../game/types";
import { calculateElo } from "../../../../utils";
import { PatchPlayerData } from "../../../../player/types";
import { PatchTournamentData } from "../../../../tournament/types";
import { IGameEngine } from "../../../../engine/IGameEngine";
import { ActiveSpecialGame } from "../../../../engine/special/types";
import { VariantRegistry } from "../../../../engine/special/variants/VariantRegistry";


const buildEloPatch = (timeControl: TimeControl, newElo: number): PatchPlayerData => {
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
};

function recomputateEloAfterTournament(tournament: ActiveTournament):
        Map<string, { initial: number; current: number }> {
    const ratingSnapshots = new Map<string, { initial: number; current: number }>();
    for (const player of tournament.players) {
        ratingSnapshots.set(player.id, { initial: player.elo, current: player.elo });
    }

    for (const round of tournament.rounds) {
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

/**
 * Finalises the tournament, persists the winner, adjusts Elo ratings, and notifies every listener.
 */
async function finishTournament(io: Server, tournament: ActiveTournament,
        tournaments: Map<string, ActiveTournament>, socketsByPlayerId: Map<string, GameSocket>) {
    if (tournament.isFinished) return;

    tournament.isFinished = true;

    const ratingSnapshots: Map<string, { initial: number; current: number }> = 
        recomputateEloAfterTournament(tournament);

    for (const player of tournament.players) {
        const snapshot = ratingSnapshots.get(player.id);
        if (snapshot) {
            player.elo = snapshot.current;
        }
    }

    const leaderboard = buildLeaderboard(tournament);
    const fallbackWinnerId = leaderboard[0]?.playerId ?? tournament.players[0]?.id;

    if (!fallbackWinnerId) {
        console.error(`❌ Unable to determine winner for tournament ${tournament.id}`);
        tournaments.delete(tournament.id);
        return;
    }

    const eloUpdatePromises: Promise<unknown>[] = [];
    for (const [playerId, snapshot] of ratingSnapshots.entries()) {
        if (snapshot.current === snapshot.initial) {
            continue;
        }

        const patch: PatchPlayerData = buildEloPatch(tournament.timeControl, snapshot.current);
        eloUpdatePromises.push(playerRepository.patch(playerId, patch));
    }

    if (eloUpdatePromises.length > 0) {
        const results = await Promise.allSettled(eloUpdatePromises);
        results.forEach(result => {
            if (result.status === "rejected") {
                console.error("❌ Failed to update player Elo after tournament", result.reason);
            }
        });
    }

    const patchTournamentData: PatchTournamentData = {
        winnerId: fallbackWinnerId,
        currentRoundIndex: tournament.currentRoundIndex,
        finishedAt: new Date(),
    };
    await tournamentRepository.patch(tournament.id, patchTournamentData);

    const roomId = tournament.id;
    console.log(`🏆 Tournament ${tournament.id} finished! Winner: ${fallbackWinnerId}`);
    const tournamentFinishedPayload: TournamentFinishedPayload = {
        tournamentId: tournament.id,
        winnerId: fallbackWinnerId,
        leaderboard,
    };
    io.to(roomId).emit(SocketEvent.TOURNAMENT_FINISHED, tournamentFinishedPayload);

    const dbTournamentPlayers = (await tournamentRepository.getTournamentPlayers(tournament.id, { pagesize: 64 })).unwrap().players;
    const playerPatchPromises: Promise<unknown>[] = [];
    dbTournamentPlayers.forEach(dbPlayer => {
        const patchPlayerData: PatchPlayerData = {
            ongoingTournamentId: null,
        };
        playerPatchPromises.push(playerRepository.patch(dbPlayer.id, patchPlayerData));

        const playerSocket = socketsByPlayerId.get(dbPlayer.id);
        if (playerSocket) {
            playerSocket.tournamentId = undefined;
            playerSocket.leave(roomId);
        }
    });

    if (playerPatchPromises.length > 0) {
        const results = await Promise.allSettled(playerPatchPromises);
        results.forEach(result => {
            if (result.status === "rejected") {
                console.error("❌ Failed to update ongoingTournamentId after tournament", result.reason);
            }
        });
    }

    tournaments.delete(tournament.id);
}

/**
 * Marks the current round as complete and either schedules the next round or
 * finalises the tournament if all rounds have been played.
 */
export async function handleRoundCompletion(tournament: ActiveTournament, io: Server,
        gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>,
        tournaments: Map<string, ActiveTournament>, specialGames: Map<string, ActiveSpecialGame>,
        variantRegistry: VariantRegistry) {
    if (tournament.isFinished) return;
    const round = tournament.rounds[tournament.currentRoundIndex];
    if (!round || round.isComplete) return;

    recomputeBuchholz(tournament);

    const leaderboard = buildLeaderboard(tournament);
    const leaderboardDbEntries: TournamentLeaderboardDbEntry[] = leaderboard.map(leaderboardEntry => ({
        playerId: leaderboardEntry.playerId,
        roundIndex: tournament.currentRoundIndex,
        score: leaderboardEntry.score,
    }));
    await tournamentRepository.registerTournamentLeaderboard(tournament.id, leaderboardDbEntries);

    round.isComplete = true;

    if (tournament.currentRoundIndex + 1 >= tournament.totalRounds) {
        await finishTournament(io, tournament, tournaments, socketsByPlayerId);
        return;
    }

    await startRound(io, tournament, gameEngines, socketsByPlayerId, tournaments, specialGames, variantRegistry);
}

/**
 * Creates the next Swiss round: pairs players, spawns games, and informs
 * clients about the round start.
 */
export async function startRound(io: Server, tournament: ActiveTournament,
        gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>,
        tournaments: Map<string, ActiveTournament>, specialGames: Map<string, ActiveSpecialGame>,
        variantRegistry: VariantRegistry) {
    if (tournament.isFinished) return;

    const nextRoundIndex = tournament.currentRoundIndex + 1;
    if (nextRoundIndex >= tournament.totalRounds) {
        await finishTournament(io, tournament, tournaments, socketsByPlayerId);
        return;
    }

    const roundNumber = nextRoundIndex + 1;
    console.log(`🌀 Starting round ${roundNumber} of tournament ${tournament.id}`);

    const round: TournamentRound = {
        id: randomUUID(),
        roundNumber,
        matches: [],
        isComplete: false,
    };

    // Seed players by score and original seeding so that Swiss pairing rules can
    // match players with similar performance.
    const sortedPlayers = [...tournament.players].sort((a, b) => {
        const standingA = getStanding(tournament, a.id);
        const standingB = getStanding(tournament, b.id);

        if (standingA.score !== standingB.score) {
            return standingB.score - standingA.score;
        }
        return a.seed - b.seed;
    });

    const availablePlayers = [...sortedPlayers];
    const pairingsPayload: TournamentPairingPayload[] = [];

    if (availablePlayers.length % 2 === 1) {
        const byePlayer = selectByeCandidate(availablePlayers, tournament);
        if (byePlayer) {
            registerBye(io, tournament, round, roundNumber, byePlayer, pairingsPayload);
        }
    }

    while (availablePlayers.length > 1) {
        // Always take the highest ranked unpaired player first.
        const player = availablePlayers.shift()!;
        const standing = getStanding(tournament, player.id);
        const playerImbalance = standing.whiteCount - standing.blackCount;

        const candidatesWithIndex = availablePlayers.map((candidate, index) => ({ candidate, index }));
        // Prefer opponents the player has not faced yet.
        let eligibleCandidates = candidatesWithIndex.filter(entry => !standing.opponents.has(entry.candidate.id));
        if (eligibleCandidates.length === 0) {
            eligibleCandidates = candidatesWithIndex;
        }

        if (standing.lastColor) {
            const oppositeColorCandidates = eligibleCandidates.filter(entry => {
                const candidateStanding = getStanding(tournament, entry.candidate.id);
                return candidateStanding.lastColor !== null && candidateStanding.lastColor !== standing.lastColor;
            });
            if (oppositeColorCandidates.length > 0) {
                eligibleCandidates = oppositeColorCandidates;
            }
        }

        let chosenEntry = eligibleCandidates[0];
        let bestCompensation = Number.POSITIVE_INFINITY;
        let bestCandidateImbalance = Number.POSITIVE_INFINITY;

        // Score each pairing option in order to minimise color imbalance.
        for (const entry of eligibleCandidates) {
            const candidateStanding = getStanding(tournament, entry.candidate.id);
            const candidateImbalance = candidateStanding.whiteCount - candidateStanding.blackCount;
            const compensationScore = Math.abs(playerImbalance + candidateImbalance);
            const absCandidateImbalance = Math.abs(candidateImbalance);

            if (compensationScore < bestCompensation
                || (compensationScore === bestCompensation && absCandidateImbalance < bestCandidateImbalance)
                || (compensationScore === bestCompensation && absCandidateImbalance === bestCandidateImbalance
                    && entry.index < chosenEntry.index)) {
                chosenEntry = entry;
                bestCompensation = compensationScore;
                bestCandidateImbalance = absCandidateImbalance;
            }
        }

        const opponent = availablePlayers.splice(chosenEntry.index, 1)[0];
        const { white, black } = assignColors(player, opponent, tournament);

        getStanding(tournament, white.id).opponents.add(black.id);
        getStanding(tournament, black.id).opponents.add(white.id);

        const matchId = randomUUID();
        const match: TournamentMatch = {
            id: matchId,
            roundNumber,
            whitePlayerId: white.id,
            blackPlayerId: black.id,
            isBye: false,
            isComplete: false,
        };
        round.matches.push(match);
        pairingsPayload.push({
            matchId,
            whitePlayerId: white.id,
            blackPlayerId: black.id,
            isBye: false,
        });
    }

    if (availablePlayers.length === 1) {
        const byePlayer = selectByeCandidate(availablePlayers, tournament);
        if (byePlayer) {
            registerBye(io, tournament, round, roundNumber, byePlayer, pairingsPayload);
        }
    }

    tournament.rounds[nextRoundIndex] = round;
    tournament.currentRoundIndex = nextRoundIndex;

    for (const match of round.matches) {
        if (match.isBye || !match.whitePlayerId || !match.blackPlayerId) {
            continue;
        }

        console.log(`🎮 Creating game between ${match.whitePlayerId} and ${match.blackPlayerId}`);
        const newGameData: NewGameData = {
            gameMode: GameMode.CLASSIC,
            matchType: MatchType.TOURNAMENT,
            tcMinutes: tournament.tcMinutes,
            tcBonus: tournament.tcBonus,
            player1Id: match.whitePlayerId,
            player2Id: match.blackPlayerId,
            whitePlayerId: match.whitePlayerId,
            blackPlayerId: match.blackPlayerId,
            tournamentId: tournament.id,
            tournamentRoundIndex: nextRoundIndex,
        };
        const newGameRes = await gameRepository.create(newGameData);
        const newGame = newGameRes.unwrap();

        match.gameId = newGame.id;
        tournament.matchesByGameId.set(newGame.id, { roundIndex: nextRoundIndex, matchId: match.id });

        await playerRepository.patch(match.whitePlayerId, { ongoingGameId: newGame.id });
        await playerRepository.patch(match.blackPlayerId, { ongoingGameId: newGame.id });

        const classicChessEngineParams: ClassicChessEngineParams = {
            whitePlayerId: newGame.whitePlayer.id, 
            blackPlayerId: newGame.blackPlayer.id,
            tcMinutes: tournament.tcMinutes,
            tcBonus: tournament.tcBonus,
            gameId: newGame.id,
            onTimeout: timeoutHandler,
            io, gameEngines, socketsByPlayerId, tournaments, specialGames, variantRegistry,
        };
        const engine: ClassicChessEngine = new ClassicChessEngine(classicChessEngineParams);
        gameEngines.set(newGame.id, engine);

        const patchGameData: PatchGameData = {
            gameStatus: GameStatus.ONGOING,
            startedAt: new Date(),
        }
        await gameRepository.patch(newGame.id, patchGameData);

        const roomId = newGame.id;
        const whiteSocket = socketsByPlayerId.get(match.whitePlayerId);
        const blackSocket = socketsByPlayerId.get(match.blackPlayerId);

        if (!whiteSocket || !blackSocket) {
            console.error("Missing player sockets for tournament match");
        }
        if (whiteSocket) {
            whiteSocket.join(roomId);
            whiteSocket.gameId = newGame.id;
            whiteSocket.tournamentId = tournament.id;
        }
        if (blackSocket) {
            blackSocket.join(roomId);
            blackSocket.gameId = newGame.id;
            blackSocket.tournamentId = tournament.id;
        }

        const tournamentGameStartedPayload: TournamentGameStartedPayload = {
            tournamentId: tournament.id,
            gameId: newGame.id,
        };
        io.to(roomId).emit(SocketEvent.TOURNAMENT_GAME_STARTED, tournamentGameStartedPayload);
    }

    const patchTournamentData: PatchTournamentData = {
        currentRoundIndex: tournament.currentRoundIndex,
        numberOfPlayers: tournament.players.length,
    }
    await tournamentRepository.patch(tournament.id, patchTournamentData);

    const tournamentRoundStartedPayload: TournamentRoundStartedPayload = {
        tournamentId: tournament.id,
        roundNumber,
        pairings: pairingsPayload,
    };
    io.to(tournament.id).emit(SocketEvent.TOURNAMENT_ROUND_STARTED, tournamentRoundStartedPayload);

    if (round.matches.every(match => match.isComplete)) {
        await handleRoundCompletion(tournament, io, gameEngines, socketsByPlayerId,
                                    tournaments, specialGames, variantRegistry);
    }
}
