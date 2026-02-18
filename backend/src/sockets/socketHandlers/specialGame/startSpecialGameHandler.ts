import { Server } from "socket.io";
import { GameSocket } from "../../socketHandlers";
import { IGameEngine } from "../../../engine/IGameEngine";
import { parseSocketPayload } from "../../socketValidation";
import { SocketEvent } from "../../socketEvents";
import { ErrorPayload, SpecialGameStartedPayload, StartSpecialGamePayload } from "../../socketPayloads";
import { startSpecialGameSocketPayloadSchema } from "../../../game/validationSchemas/socketValidationSchemas";
import { VariantRegistry } from "../../../engine/special/variants/VariantRegistry";
import { specialGameRepository } from "../../../specialGame/repository/specialGameRepository";
import { GetSpecialGamePlayersData, PatchSpecialGameData, SpecialConfigurationNormal } from "../../../specialGame/types";
import { ActiveSpecialGame, SpecialGameOrchestrationContext,
    SpecialGamePlayer, SpecialGamePlayerStanding } from "../../../engine/special/types";
import { parseElo } from "../../../utils";
import { GameMode } from "@prisma/client";


export async function startSpecialGameHandler(io: Server, socket: GameSocket, payload: StartSpecialGamePayload,
            specialGames: Map<string, ActiveSpecialGame>, variantRegistry: VariantRegistry,
            gameEngines: Map<string, IGameEngine>, socketsByPlayerId: Map<string, GameSocket>) {
    const parsedPayload = await parseSocketPayload(socket, startSpecialGameSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, specialGameId } = parsedPayload;

    try {
        const specialGame = (await specialGameRepository.getById(specialGameId)).unwrap();
        if (playerId !== specialGame.owner.id) {
            console.error("❌ Only the owner can start the special game");
            return;
        }

        const getSpecialGamePlayersData: GetSpecialGamePlayersData = { pagesize: 64 };
        const specialGamePlayers = (await specialGameRepository.getSpecialGamePlayers(specialGameId, getSpecialGamePlayersData)).unwrap();
        const configuration: SpecialConfigurationNormal = specialGame.specialConfiguration;
        const variant = variantRegistry.getVariant(configuration.variantKey);
        if (!variant) {
            console.error("Failed to load the special game variant");
            return;
        }

        if (specialGamePlayers.totalCount < variant.minimumCapacity) {
            console.error("❌ At least", variant.minimumCapacity, "players are required for starting this special game");
            return;
        }
        if (specialGamePlayers.totalCount > variant.maximumCapacity) {
            console.error("❌ At most", variant.maximumCapacity, "players are allowed for starting this special game");
            return;
        }

        const playersWithElo = specialGamePlayers.players.map(p => ({
            id: p.id,
            elo: parseElo(true, GameMode.SPECIAL, specialGame.timeControl, p, p),
        }));

        const seededPlayers: SpecialGamePlayer[] = [...playersWithElo]
            .sort((a, b) => b.elo - a.elo)
            .map((player, index) => ({ ...player, seed: index + 1 }));

        const standings = new Map<string, SpecialGamePlayerStanding>();
        for (const player of seededPlayers) {
            standings.set(player.id, {
                playerId: player.id,
                score: 0,
                colorHistory: [],
                lastColor: null,
                whiteCount: 0,
                blackCount: 0,
                hasBye: false,
                opponents: new Set(),
            });
        }

        const numberOfPlayers = seededPlayers.length;
        const totalRounds = variant.totalRounds;

        const activeSpecialGame: ActiveSpecialGame = {
            id: specialGameId,
            players: seededPlayers,
            rounds: [],
            currentRoundIndex: -1,
            isFinished: false,
            gameMode: GameMode.SPECIAL,
            matchType: specialGame.matchType,
            timeControl: specialGame.timeControl,
            tcMinutes: specialGame.tcMinutes,
            tcBonus: specialGame.tcBonus,
            matchesByGameId: new Map(),
            configuration, standings, totalRounds,
        };
        specialGames.set(specialGameId, activeSpecialGame);

        const patchSpecialGameData: PatchSpecialGameData = {
            startedAt: new Date(),
            numberOfPlayers, totalRounds,
        };
        await specialGameRepository.patch(specialGameId, patchSpecialGameData);

        const specialGameStartedPayload: SpecialGameStartedPayload = {
            specialGameId,
        };
        io.to(specialGameId).emit(SocketEvent.SPECIAL_GAME_STARTED, specialGameStartedPayload);

        const orchestrator = variant.createOrchestrator();
        const orchestrationContext: SpecialGameOrchestrationContext = {
            io,
            specialGame: activeSpecialGame,
            gameEngines,
            socketsByPlayerId,
            specialGames,
        };
        await orchestrator.startSpecialGameRound(orchestrationContext);
    }
    catch (e) {
        console.error("Failed to process game action:", e);
        const errorPayload: ErrorPayload = {
            message: "Start special game operation failed.",
        };
        socket.emit(SocketEvent.ERROR, errorPayload);
        return;
    }
}
