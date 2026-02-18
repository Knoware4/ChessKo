import { Server } from "socket.io";
import { tournamentRepository } from "../../../tournament/repository/tournamentRepository";
import { GetTournamentPlayersData, PatchTournamentData } from "../../../tournament/types";
import { parseElo } from "../../../utils";
import { SocketEvent } from "../../socketEvents";
import { GameSocket } from "../../socketHandlers";
import { ErrorPayload, StartTournamentPayload, TournamentStartedPayload } from "../../socketPayloads";
import { startRound } from "./swissTournamentLogic/roundLifecycle";
import { ActiveTournament, PlayerStanding, TournamentPlayer } from "./swissTournamentLogic/types";
import { parseSocketPayload } from "../../socketValidation";
import { IGameEngine } from "../../../engine/IGameEngine";
import { startTournamentSocketPayloadSchema } from "../../../tournament/validationSchemas/socketValidationSchemas";
import { ActiveSpecialGame } from "../../../engine/special/types";
import { VariantRegistry } from "../../../engine/special/variants/VariantRegistry";
import { GameMode } from "@prisma/client";


export async function startTournamentHandler(io: Server, socket: GameSocket, payload: StartTournamentPayload,
        gameEngines: Map<string, IGameEngine>, tournaments: Map<string, ActiveTournament>,
        socketsByPlayerId: Map<string, GameSocket>, specialGames: Map<string, ActiveSpecialGame>,
        variantRegistry: VariantRegistry) {
    const parsedPayload = await parseSocketPayload(socket, startTournamentSocketPayloadSchema, payload);
    if (!parsedPayload) {
        return;
    }

    const { playerId, tournamentId } = parsedPayload;
    console.log("Player", playerId, "wants to start tournament:", tournamentId);

    try {
        const tournament = (await tournamentRepository.getById(tournamentId)).unwrap();
        if (playerId !== tournament.owner.id) {
            console.error("❌ Only the owner can start the tournament");
            return;
        }

        const getTournamentPlayersData: GetTournamentPlayersData = { pagesize: 64 };
        const tournamentPlayers = (await tournamentRepository.getTournamentPlayers(tournamentId, getTournamentPlayersData)).unwrap();

        if (tournamentPlayers.totalCount < 3) {
            console.error("❌ At least three players are required for starting the tournament");
            return;
        }

        const playersWithElo = tournamentPlayers.players.map(p => ({
            id: p.id,
            elo: parseElo(true, GameMode.CLASSIC, tournament.timeControl, p, p),
        }));

        const seededPlayers: TournamentPlayer[] = [...playersWithElo]
            .sort((a, b) => b.elo - a.elo)
            .map((player, index) => ({ ...player, seed: index + 1 }));

        const standings = new Map<string, PlayerStanding>();
        for (const player of seededPlayers) {
            standings.set(player.id, {
                playerId: player.id,
                score: 0,
                buchholz: 0,
                colorHistory: [],
                lastColor: null,
                whiteCount: 0,
                blackCount: 0,
                hasBye: false,
                opponents: new Set(),
            });
        }

        const numberOfPlayers = seededPlayers.length;
        const totalRounds = numberOfPlayers < 10 
            ? (numberOfPlayers % 2 === 0 ? (numberOfPlayers - 1) : numberOfPlayers)
            : 9;

        const activeTournament: ActiveTournament = {
            id: tournamentId,
            players: seededPlayers,
            standings,
            rounds: [],
            currentRoundIndex: -1,
            totalRounds,
            isFinished: false,
            timeControl: tournament.timeControl,
            tcMinutes: tournament.tcMinutes,
            tcBonus: tournament.tcBonus,
            matchesByGameId: new Map(),
        };
        tournaments.set(tournamentId, activeTournament);

        const patchTournamentData: PatchTournamentData = {
            startedAt: new Date(),
            numberOfPlayers, totalRounds,
        };
        await tournamentRepository.patch(tournamentId, patchTournamentData);

        const tournamentStartedPayload: TournamentStartedPayload = {
            tournamentId,
        };
        io.to(tournamentId).emit(SocketEvent.TOURNAMENT_STARTED, tournamentStartedPayload);

        await startRound(io, activeTournament, gameEngines, socketsByPlayerId,
                         tournaments, specialGames, variantRegistry);
    }
    catch (e) {
        console.error("Failed to process (start) tournament action:", e);
        const errorPayload: ErrorPayload = { message: "Tournament operation failed." };
        socket.emit(SocketEvent.ERROR, errorPayload);
    }
}
