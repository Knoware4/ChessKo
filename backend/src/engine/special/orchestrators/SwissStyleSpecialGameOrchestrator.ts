import { randomUUID } from "node:crypto";
import { Color, GameMode, GameResult, GameStatus, UpgradeKey } from "@prisma/client";
import { ActiveSpecialGame, SpecialGameGameCompletionContext, SpecialGameLeaderboardDbEntry,
    SpecialGameMatch, SpecialGameOrchestrationContext, SpecialGameOrchestrator,
    SpecialGamePlayer, SpecialGamePlayerStanding, SpecialGameRound } from "../types";
import { SpecialChessEngine, SpecialChessEngineParams } from "../../SpecialChessEngine";
import { timeoutHandler } from "../../../sockets/socketHandlers/game/timeoutHandler";
import { PatchSpecialGameData, SpecialConfigurationNormal } from "../../../specialGame/types";
import { specialGameRepository } from "../../../specialGame/repository/specialGameRepository";
import { NewGameData, PatchGameData } from "../../../game/types";
import { gameRepository } from "../../../game/repository/gameRepository";
import { playerRepository } from "../../../player/repository/playerRepository";
import { IGameEngine } from "../../IGameEngine";
import { buildLeaderboard, getStanding, recomputateEloAfterSpecialGame, buildEloPatch } from "./utils";
import { SpecialGameFinishedPayload, SpecialGameGameStartedPayload, SpecialGamePairingPayload,
    SpecialGamePlayerByePayload, SpecialGameRoundStartedPayload } from "../../../sockets/socketPayloads";
import { SocketEvent } from "../../../sockets/socketEvents";
import { PatchPlayerData } from "../../../player/types";
import { Server } from "socket.io";


function assignColors(
    playerA: SpecialGamePlayer,
    playerB: SpecialGamePlayer,
    specialGame: ActiveSpecialGame,
) {
    const idToPlayer = new Map<string, SpecialGamePlayer>([
        [playerA.id, playerA],
        [playerB.id, playerB],
    ]);

    const evaluate = (whiteId: string, blackId: string) => {
        const whiteStanding = getStanding(specialGame, whiteId);
        const blackStanding = getStanding(specialGame, blackId);

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

    const whiteStanding = getStanding(specialGame, chosen.whiteId);
    const blackStanding = getStanding(specialGame, chosen.blackId);

    whiteStanding.whiteCount += 1;
    whiteStanding.lastColor = Color.WHITE;
    whiteStanding.colorHistory.push(Color.WHITE);

    blackStanding.blackCount += 1;
    blackStanding.lastColor = Color.BLACK;
    blackStanding.colorHistory.push(Color.BLACK);

    const white = idToPlayer.get(chosen.whiteId)!;
    const black = idToPlayer.get(chosen.blackId)!;

    return { white, black };
}

function selectByeCandidate(players: SpecialGamePlayer[], specialGame: ActiveSpecialGame): SpecialGamePlayer | undefined {
    const pickCandidate = (predicate: (standing: SpecialGamePlayerStanding) => boolean) => {
        let fallback: { index: number; player: SpecialGamePlayer } | undefined;

        for (let i = players.length - 1; i >= 0; i--) {
            const player = players[i];
            const standing = getStanding(specialGame, player.id);

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

function registerBye(
    io: Server,
    specialGame: ActiveSpecialGame,
    round: SpecialGameRound,
    roundNumber: number,
    byePlayer: SpecialGamePlayer,
    pairingsPayload: SpecialGamePairingPayload[],
) {
    const standing = getStanding(specialGame, byePlayer.id);
    standing.score += 1;
    standing.hasBye = true;

    const matchId = randomUUID();
    const byeMatch: SpecialGameMatch = {
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

    io.to(specialGame.id).emit(SocketEvent.SPECIAL_GAME_PLAYER_BYE, {
        specialGameId: specialGame.id,
        roundNumber,
        playerId: byePlayer.id,
    } satisfies SpecialGamePlayerByePayload);
}

function buildDefaultEngineParams(
    configuration: SpecialConfigurationNormal,
    roundMatch: SpecialGameMatch,
    ctx: SpecialGameOrchestrationContext,
): SpecialChessEngineParams {
    return {
        whitePlayerId: roundMatch.whitePlayerId!,
        blackPlayerId: roundMatch.blackPlayerId!,
        configuration: configuration,
        io: ctx.io,
        tcMinutes: ctx.specialGame.tcMinutes,
        tcBonus: ctx.specialGame.tcBonus,
        gameId: roundMatch.gameId!,
        gameEngines: ctx.gameEngines,
        socketsByPlayerId: ctx.socketsByPlayerId,
        tournaments: new Map(),
        specialGames: ctx.specialGames,
        onTimeout: timeoutHandler,
    } satisfies SpecialChessEngineParams;
}

// Swiss tournament style orchestrator (for more rounds)
export class SwissStyleSpecialGameOrchestrator implements SpecialGameOrchestrator {

    async startSpecialGameRound(context: SpecialGameOrchestrationContext): Promise<void> {
        const { specialGame, io, gameEngines, socketsByPlayerId } = context;
        if (specialGame.isFinished) return;

        const nextRoundIndex = specialGame.currentRoundIndex + 1;
        if (nextRoundIndex >= specialGame.totalRounds) {
            await this.finishSpecialGame(context);
            return;
        }

        const roundNumber = nextRoundIndex + 1;
        console.log(`🌀 Starting round ${roundNumber} of special game ${specialGame.id}`);

        const round: SpecialGameRound = {
            id: randomUUID(),
            roundNumber,
            matches: [],
            isComplete: false,
        };

        const sortedPlayers = [...specialGame.players].sort((a, b) => {
            const standingA = getStanding(specialGame, a.id);
            const standingB = getStanding(specialGame, b.id);

            if (standingA.score !== standingB.score) {
                return standingB.score - standingA.score;
            }
            return a.seed - b.seed;
        });

        const availablePlayers = [...sortedPlayers];
        const pairingsPayload: SpecialGamePairingPayload[] = [];

        if (availablePlayers.length % 2 === 1) {
            const byePlayer = selectByeCandidate(availablePlayers, specialGame);
            if (byePlayer) {
                registerBye(context.io, specialGame, round, roundNumber, byePlayer, pairingsPayload);
            }
        }

        while (availablePlayers.length > 1) {
            const player = availablePlayers.shift()!;
            const standing = getStanding(specialGame, player.id);
            const playerImbalance = standing.whiteCount - standing.blackCount;

            const candidatesWithIndex = availablePlayers.map((candidate, index) => ({ candidate, index }));
            let eligibleCandidates = candidatesWithIndex.filter(entry => !standing.opponents.has(entry.candidate.id));
            if (eligibleCandidates.length === 0) {
                eligibleCandidates = candidatesWithIndex;
            }

            if (standing.lastColor) {
                const oppositeColorCandidates = eligibleCandidates.filter(entry => {
                    const candidateStanding = getStanding(specialGame, entry.candidate.id);
                    return candidateStanding.lastColor !== null && candidateStanding.lastColor !== standing.lastColor;
                });
                if (oppositeColorCandidates.length > 0) {
                    eligibleCandidates = oppositeColorCandidates;
                }
            }

            let chosenEntry = eligibleCandidates[0];
            let bestCompensation = Number.POSITIVE_INFINITY;
            let bestCandidateImbalance = Number.POSITIVE_INFINITY;

            for (const entry of eligibleCandidates) {
                const candidateStanding = getStanding(specialGame, entry.candidate.id);
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
            const { white, black } = assignColors(player, opponent, specialGame);

            getStanding(specialGame, white.id).opponents.add(black.id);
            getStanding(specialGame, black.id).opponents.add(white.id);

            const matchId = randomUUID();
            const match: SpecialGameMatch = {
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
            const byePlayer = selectByeCandidate(availablePlayers, specialGame);
            if (byePlayer) {
                registerBye(context.io, specialGame, round, roundNumber, byePlayer, pairingsPayload);
            }
        }

        specialGame.rounds[nextRoundIndex] = round;
        specialGame.currentRoundIndex = nextRoundIndex;

        for (const match of round.matches) {
            if (match.isBye || !match.whitePlayerId || !match.blackPlayerId) {
                continue;
            }

            const whiteSocket = socketsByPlayerId.get(match.whitePlayerId);
            const blackSocket = socketsByPlayerId.get(match.blackPlayerId);

            const newGameData: NewGameData = {
                gameMode: GameMode.SPECIAL,
                matchType: specialGame.matchType,
                tcMinutes: specialGame.tcMinutes,
                tcBonus: specialGame.tcBonus,
                gameStatus: GameStatus.ONGOING,
                player1Id: match.whitePlayerId,
                player2Id: match.blackPlayerId,
                whitePlayerId: match.whitePlayerId,
                blackPlayerId: match.blackPlayerId,
                specialConfigurationId: specialGame.configuration.id,
            };
            const newGameRes = await gameRepository.create(newGameData);
            const newGame = newGameRes.unwrap();

            match.gameId = newGame.id;
            specialGame.matchesByGameId.set(newGame.id, { roundIndex: nextRoundIndex, matchId: match.id });

            await playerRepository.patch(match.whitePlayerId, { ongoingGameId: newGame.id });
            await playerRepository.patch(match.blackPlayerId, { ongoingGameId: newGame.id });

            const engineParams = buildDefaultEngineParams(specialGame.configuration, match, context);
            const engine: IGameEngine = new SpecialChessEngine({
                ...engineParams,
                gameEngines,
                socketsByPlayerId,
                tournaments: new Map(),
                io,
            });
            gameEngines.set(newGame.id, engine);

            const patchGameData: PatchGameData = {
                gameStatus: GameStatus.ONGOING,
                startedAt: new Date(),
            };
            await gameRepository.patch(newGame.id, patchGameData);

            const roomId = newGame.id;
            if (whiteSocket) {
                whiteSocket.join(roomId);
                whiteSocket.gameId = newGame.id;
                whiteSocket.specialGameId = specialGame.id;
            }
            if (blackSocket) {
                blackSocket.join(roomId);
                blackSocket.gameId = newGame.id;
                blackSocket.specialGameId = specialGame.id;
            }

            const specialGameGameStartedPayload: SpecialGameGameStartedPayload = {
                specialGameId: specialGame.id,
                gameId: newGame.id,
            };
            io.to(roomId).emit(SocketEvent.SPECIAL_GAME_GAME_STARTED, specialGameGameStartedPayload);
        }

        const patchSpecialGameData: PatchSpecialGameData = {
            currentRoundIndex: specialGame.currentRoundIndex,
            numberOfPlayers: specialGame.players.length,
        };
        await specialGameRepository.patch(specialGame.id, patchSpecialGameData);

        const specialGameRoundStartedPayload: SpecialGameRoundStartedPayload = {
                specialGameId: specialGame.id,
                roundNumber,
                pairings: pairingsPayload,
            };
            io.to(specialGame.id).emit(SocketEvent.SPECIAL_GAME_ROUND_STARTED, specialGameRoundStartedPayload);

        if (round.matches.every(match => match.isComplete)) {
            await this.handleSpecialGameRoundCompletion(context);
        }
    }

    async handleSpecialGameRoundCompletion(context: SpecialGameOrchestrationContext): Promise<void> {
        const { specialGame } = context;
        if (specialGame.isFinished) return;

        const round = specialGame.rounds[specialGame.currentRoundIndex];
        if (!round || round.isComplete) return;

        const leaderboard = buildLeaderboard(specialGame);
        const leaderboardDbEntries: SpecialGameLeaderboardDbEntry[] = leaderboard.map(leaderboardEntry => ({
            playerId: leaderboardEntry.playerId,
            roundIndex: specialGame.currentRoundIndex,
            score: leaderboardEntry.score,
        }));
        await specialGameRepository.registerSpecialGameLeaderboard(specialGame.id, leaderboardDbEntries);

        round.isComplete = true;

        if (specialGame.currentRoundIndex + 1 >= specialGame.totalRounds) {
            await this.finishSpecialGame(context);
            return;
        }

        await this.startSpecialGameRound(context);
    }

    async handleSpecialGameGameCompletion(context: SpecialGameGameCompletionContext): Promise<void> {
        const { specialGame, gameId, result } = context;
        const matchReference = specialGame.matchesByGameId.get(gameId);
        if (!matchReference) {
            console.error(`Special game match for game ${gameId} not found`);
            return;
        }

        const round = specialGame.rounds[matchReference.roundIndex];
        if (!round) {
            console.error(`Round ${matchReference.roundIndex} not found for special game ${specialGame.id}`);
            return;
        }

        const match = round.matches.find(m => m.id === matchReference.matchId);
        if (!match || match.isComplete) {
            return;
        }

        match.result = result;
        match.isComplete = true;

        if (match.whitePlayerId && match.blackPlayerId) {
            const whiteStanding = getStanding(specialGame, match.whitePlayerId);
            const blackStanding = getStanding(specialGame, match.blackPlayerId);

            if (result === GameResult.WHITE) {
                match.winnerId = match.whitePlayerId;
                whiteStanding.score += 1;
            }
            else if (result === GameResult.BLACK) {
                match.winnerId = match.blackPlayerId;
                blackStanding.score += 1;
            }
            else {
                whiteStanding.score += 0.5;
                blackStanding.score += 0.5;
            }
        }

        specialGame.matchesByGameId.delete(gameId);

        if (round.matches.every(m => m.isComplete)) {
            await this.handleSpecialGameRoundCompletion(context);
        }
    }

    async finishSpecialGame(context: SpecialGameOrchestrationContext): Promise<void> {
        const { specialGame, specialGames, socketsByPlayerId } = context;
        if (specialGame.isFinished) return;

        specialGame.isFinished = true;

        const ratingSnapshots: Map<string, { initial: number; current: number }> = 
            recomputateEloAfterSpecialGame(specialGame);

        for (const player of specialGame.players) {
            const snapshot = ratingSnapshots.get(player.id);
            if (snapshot) {
                player.elo = snapshot.current;
            }
        }


        const leaderboard = buildLeaderboard(specialGame);
        const fallbackWinnerId = leaderboard[0]?.playerId ?? specialGame.players[0]?.id;

        if (!fallbackWinnerId) {
            console.error(`❌ Unable to determine winner for special game ${specialGame.id}`);
            specialGames.delete(specialGame.id);
            return;
        }

        const eloUpdatePromises: Promise<unknown>[] = [];
        for (const [playerId, snapshot] of ratingSnapshots.entries()) {
            if (snapshot.current === snapshot.initial) {
                continue;
            }

            const patch: PatchPlayerData = buildEloPatch(specialGame.gameMode, specialGame.timeControl, snapshot.current);
            eloUpdatePromises.push(playerRepository.patch(playerId, patch));
        }

        if (eloUpdatePromises.length > 0) {
            const results = await Promise.allSettled(eloUpdatePromises);
            results.forEach(result => {
                if (result.status === "rejected") {
                    console.error("❌ Failed to update player Elo after special game", result.reason);
                }
            });
        }

        const patchSpecialGameData: PatchSpecialGameData = {
            finishedAt: new Date(),
            currentRoundIndex: specialGame.currentRoundIndex,
            winnerId: fallbackWinnerId,
        };
        await specialGameRepository.patch(specialGame.id, patchSpecialGameData);

        const roomId = specialGame.id;
        console.log(`🏆 Special game ${specialGame.id} finished! Winner: ${fallbackWinnerId}`);
        const specialGameFinishedPayload: SpecialGameFinishedPayload = {
            specialGameId: specialGame.id,
            winnerId: fallbackWinnerId,
            leaderboard,
        };
        context.io.to(roomId).emit(SocketEvent.SPECIAL_GAME_FINISHED, specialGameFinishedPayload);

        const dbSpecialGamePlayers = (await specialGameRepository.getSpecialGamePlayers(specialGame.id, { pagesize: 64 })).unwrap().players;
        const playerPatchPromises: Promise<unknown>[] = [];
        dbSpecialGamePlayers.forEach(dbPlayer => {
            const patchPlayerData: PatchPlayerData = {
                ongoingSpecialGameId: null,
            };
            playerPatchPromises.push(playerRepository.patch(dbPlayer.id, patchPlayerData));
    
            const playerSocket = socketsByPlayerId.get(dbPlayer.id);
            if (playerSocket) {
                playerSocket.specialGameId = undefined;
                playerSocket.leave(roomId);
            }
        });
    
        if (playerPatchPromises.length > 0) {
            const results = await Promise.allSettled(playerPatchPromises);
            results.forEach(result => {
                if (result.status === "rejected") {
                    console.error("❌ Failed to update ongoingSpecialGameId after special game", result.reason);
                }
            });
        }

        specialGames.delete(specialGame.id);
    }
}
