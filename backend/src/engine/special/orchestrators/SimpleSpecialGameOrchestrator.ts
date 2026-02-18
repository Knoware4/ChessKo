import { randomUUID } from "node:crypto";
import { Color, GameMode, GameResult, GameStatus, UpgradeKey } from "@prisma/client";
import {
    SpecialGameGameCompletionContext,
    SpecialGameLeaderboardDbEntry,
    SpecialGameMatch,
    SpecialGameOrchestrationContext,
    SpecialGameOrchestrator,
    SpecialGameRound,
} from "../types";
import { SpecialChessEngine, SpecialChessEngineParams } from "../../SpecialChessEngine";
import { timeoutHandler } from "../../../sockets/socketHandlers/game/timeoutHandler";
import { PatchSpecialGameData } from "../../../specialGame/types";
import { specialGameRepository } from "../../../specialGame/repository/specialGameRepository";
import { NewGameData, PatchGameData } from "../../../game/types";
import { gameRepository } from "../../../game/repository/gameRepository";
import { playerRepository } from "../../../player/repository/playerRepository";
import { IGameEngine } from "../../IGameEngine";
import { SocketEvent } from "../../../sockets/socketEvents";
import { SpecialGameFinishedPayload, SpecialGameGameStartedPayload, SpecialGamePairingPayload, SpecialGameRoundStartedPayload, ValidSpecialMoveWithAfterFen } from "../../../sockets/socketPayloads";
import { PatchPlayerData } from "../../../player/types";
import { recomputateEloAfterSpecialGame, buildEloPatch, getStanding, buildLeaderboard } from "./utils";


function buildDefaultEngineParams(
    roundMatch: SpecialGameMatch,
    ctx: SpecialGameOrchestrationContext,
): SpecialChessEngineParams {
    return {
        whitePlayerId: roundMatch.whitePlayerId!,
        blackPlayerId: roundMatch.blackPlayerId!,
        configuration: ctx.specialGame.configuration,
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


// Simple orchestrator for one game of two players (one round of one match)
export class SimpleSpecialGameOrchestrator implements SpecialGameOrchestrator {
    async startSpecialGameRound(context: SpecialGameOrchestrationContext): Promise<void> {
        const { specialGame, io, gameEngines, socketsByPlayerId } = context;
        if (specialGame.isFinished) return;

        const nextRoundIndex = specialGame.currentRoundIndex + 1;
        if (nextRoundIndex >= specialGame.totalRounds) {
            await this.finishSpecialGame(context);
            return;
        }

        const [whitePlayer, blackPlayer] = [...specialGame.players];
        const whiteStanding = getStanding(specialGame, whitePlayer.id);
        const blackStanding = getStanding(specialGame, blackPlayer.id);

        whiteStanding.whiteCount += 1;
        whiteStanding.lastColor = Color.WHITE;
        whiteStanding.colorHistory.push(Color.WHITE);

        blackStanding.blackCount += 1;
        blackStanding.lastColor = Color.BLACK;
        blackStanding.colorHistory.push(Color.BLACK);

        whiteStanding.opponents.add(blackPlayer.id);
        blackStanding.opponents.add(whitePlayer.id);

        const roundNumber = nextRoundIndex + 1;
        const matchId = randomUUID();
        const match: SpecialGameMatch = {
            id: matchId,
            roundNumber,
            whitePlayerId: whitePlayer.id,
            blackPlayerId: blackPlayer.id,
            isBye: false,
            isComplete: false,
        };
        const round: SpecialGameRound = {
            id: randomUUID(),
            roundNumber,
            matches: [match],
            isComplete: false,
        };

        specialGame.rounds[nextRoundIndex] = round;
        specialGame.currentRoundIndex = nextRoundIndex;

        const whiteSocket = socketsByPlayerId.get(match.whitePlayerId!);
        const blackSocket = socketsByPlayerId.get(match.blackPlayerId!);

        const newGameData: NewGameData = {
            gameMode: GameMode.SPECIAL,
            matchType: specialGame.matchType,
            tcMinutes: specialGame.tcMinutes,
            tcBonus: specialGame.tcBonus,
            player1Id: match.whitePlayerId!,
            player2Id: match.blackPlayerId!,
            whitePlayerId: match.whitePlayerId!,
            blackPlayerId: match.blackPlayerId!,
            specialConfigurationId: specialGame.configuration.id,
        };
        const newGame = (await gameRepository.create(newGameData)).unwrap();

        match.gameId = newGame.id;
        specialGame.matchesByGameId.set(newGame.id, { roundIndex: nextRoundIndex, matchId: match.id });

        await playerRepository.patch(match.whitePlayerId!, { ongoingGameId: newGame.id });
        await playerRepository.patch(match.blackPlayerId!, { ongoingGameId: newGame.id });

        const engineParams = buildDefaultEngineParams(match, context);
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
    
        const patchSpecialGameData: PatchSpecialGameData = {
            currentRoundIndex: specialGame.currentRoundIndex,
            numberOfPlayers: specialGame.players.length,
        };
        await specialGameRepository.patch(specialGame.id, patchSpecialGameData);
        
        const pairingsPayload: SpecialGamePairingPayload[] = [{
            matchId,
            whitePlayerId: whitePlayer.id,
            blackPlayerId: blackPlayer.id,
            isBye: false,
        }];

        const specialGameRoundStartedPayload: SpecialGameRoundStartedPayload = {
            specialGameId: specialGame.id,
            roundNumber,
            pairings: pairingsPayload,
        };
        io.to(specialGame.id).emit(SocketEvent.SPECIAL_GAME_ROUND_STARTED, specialGameRoundStartedPayload);
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
        await this.finishSpecialGame(context);
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
