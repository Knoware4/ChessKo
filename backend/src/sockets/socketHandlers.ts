import { Server, Socket as IOSocket } from "socket.io";
import { AcceptDrawPayload, AcceptUndoPayload, CreateSpecialGamePayload, CreateTournamentPayload,
    DeclineDrawPayload, DeclineUndoPayload, JoinSpecialGamePayload, JoinTournamentPayload,
    KickFromSpecialGamePayload, KickFromTournamentPayload, LeaveSpecialGamePayload,
    LeaveTournamentPayload, LoadOngoingGamePayload, MovePayload, OfferDrawPayload, OfferUndoPayload,
    ResignPayload, SaveConfigurationPayload, SearchGamePayload, SocketIdentificationPayload,
    StartSpecialGamePayload, StartTournamentPayload, StopSearchingPayload,
} from "./socketPayloads";
import { SocketEvent } from "./socketEvents";
import { loadOngoingGameHandler } from "./socketHandlers/game/loadOngoingGameHandler";
import { searchGameHandler } from "./socketHandlers/game/searchGameHandler";
import { stopSearchingHandler } from "./socketHandlers/game/stopSearchingHandler";
import { moveHandler } from "./socketHandlers/game/moveHandler";
import { offerDrawHandler } from "./socketHandlers/game/draw/offerDrawHandler";
import { acceptDrawHandler } from "./socketHandlers/game/draw/acceptDrawHandler";
import { declineDrawHandler } from "./socketHandlers/game/draw/declineDrawHandler";
import { offerUndoHandler } from "./socketHandlers/game/undo/offerUndoHandler";
import { acceptUndoHandler } from "./socketHandlers/game/undo/acceptUndoHandler";
import { declineUndoHandler } from "./socketHandlers/game/undo/declineUndoHandler";
import { resignHandler } from "./socketHandlers/game/resignHandler";
import { createTournamentHandler } from "./socketHandlers/tournaments/createTournamentHandler";
import { joinTournamentHandler } from "./socketHandlers/tournaments/joinTournamentHandler";
import { startTournamentHandler } from "./socketHandlers/tournaments/startTournamentHandler";
import { kickFromTournamentHandler } from "./socketHandlers/tournaments/kickFromTournamentHandler";
import { leaveTournamentHandler } from "./socketHandlers/tournaments/leaveTournamentHandler";
import { disconnectHandler } from "./socketHandlers/disconnectHandler";
import { ActiveTournament } from "./socketHandlers/tournaments/swissTournamentLogic/types";
import { socketIdentificationHandler } from "./socketHandlers/socketIdentificationHandler";
import { IGameEngine } from "../engine/IGameEngine";
import { createSpecialGameHandler } from "./socketHandlers/specialGame/createSpecialGameHandler";
import { joinSpecialGameHandler } from "./socketHandlers/specialGame/joinSpecialGameHandler";
import { startSpecialGameHandler } from "./socketHandlers/specialGame/startSpecialGameHandler";
import { VariantRegistry } from "../engine/special/variants/VariantRegistry";
import { ActiveSpecialGame } from "../engine/special/types";
import { leaveSpecialGameHandler } from "./socketHandlers/specialGame/leaveSpecialGameHandler";
import { kickFromSpecialGameHandler } from "./socketHandlers/specialGame/kickFromSpecialGameHandler";
import { saveConfigurationHandler } from "./socketHandlers/saveConfigurationHandler";


const gameEngines = new Map<string, IGameEngine>();
const socketsById = new Map<string, GameSocket>();
const socketsByPlayerId = new Map<string, GameSocket>();
const tournaments = new Map<string, ActiveTournament>();
const specialGames = new Map<string, ActiveSpecialGame>();
const variantRegistry: VariantRegistry = new VariantRegistry();

export interface GameSocket extends IOSocket {
    gameId?: string;
    playerId?: string;
    tournamentId?: string;
    specialGameId?: string;
}


export function registerSocketHandlers(io: Server) {
    io.on("connection", (socket: GameSocket) => {

        socketsById.set(socket.id, socket);
        socket.on(SocketEvent.SOCKET_IDENTIFICATION, (payload: SocketIdentificationPayload) => {
            socketIdentificationHandler(io, socket, payload, socketsByPlayerId);
        });

        socket.on(SocketEvent.SAVE_CONFIGURATION, (payload: SaveConfigurationPayload) => {
            saveConfigurationHandler(io, socket, payload);
        });
        socket.on(SocketEvent.CREATE_SPECIAL_GAME, (payload: CreateSpecialGamePayload) => {
            createSpecialGameHandler(io, socket, payload, variantRegistry);
        });
        socket.on(SocketEvent.JOIN_SPECIAL_GAME, (payload: JoinSpecialGamePayload) => {
            joinSpecialGameHandler(io, socket, payload, variantRegistry);
        });
        socket.on(SocketEvent.LEAVE_SPECIAL_GAME, (payload: LeaveSpecialGamePayload) => {
            leaveSpecialGameHandler(io, socket, payload, socketsByPlayerId);
        });
        socket.on(SocketEvent.KICK_FROM_SPECIAL_GAME, (payload: KickFromSpecialGamePayload) => {
            kickFromSpecialGameHandler(io, socket, payload, socketsByPlayerId);
        });
        socket.on(SocketEvent.START_SPECIAL_GAME, (payload: StartSpecialGamePayload) => {
            startSpecialGameHandler(io, socket, payload, specialGames, variantRegistry, gameEngines, socketsByPlayerId);
        });
        socket.on(SocketEvent.LOAD_ONGOING_GAME, (payload: LoadOngoingGamePayload) => {
            loadOngoingGameHandler(io, socket, payload, gameEngines);
        });
        socket.on(SocketEvent.CREATE_TOURNAMENT, (payload: CreateTournamentPayload) => {
            createTournamentHandler(io, socket, payload);
        });
        socket.on(SocketEvent.JOIN_TOURNAMENT, (payload: JoinTournamentPayload) => {
            joinTournamentHandler(io, socket, payload);
        });
        socket.on(SocketEvent.START_TOURNAMENT, (payload: StartTournamentPayload) => {
            startTournamentHandler(io, socket, payload, gameEngines, tournaments, socketsByPlayerId, specialGames, variantRegistry);
        });
        socket.on(SocketEvent.KICK_FROM_TOURNAMENT, (payload: KickFromTournamentPayload) => {
            kickFromTournamentHandler(io, socket, payload, socketsByPlayerId, tournaments);
        });
        socket.on(SocketEvent.LEAVE_TOURNAMENT, (payload: LeaveTournamentPayload) => {
            leaveTournamentHandler(io, socket, payload, socketsByPlayerId, tournaments);
        });
        socket.on(SocketEvent.SEARCH_GAME, (payload: SearchGamePayload) => {
            searchGameHandler(io, socket, payload, gameEngines, socketsByPlayerId, tournaments, specialGames, variantRegistry);
        });
        socket.on(SocketEvent.STOP_SEARCHING, (payload: StopSearchingPayload) => {
            stopSearchingHandler(io, socket, payload);
        });
        socket.on(SocketEvent.MOVE, (payload: MovePayload) => {
            moveHandler(io, socket, payload, gameEngines, socketsByPlayerId, tournaments, specialGames, variantRegistry);
        });
        socket.on(SocketEvent.OFFER_DRAW, (payload: OfferDrawPayload) => {
            offerDrawHandler(io, socket, payload, gameEngines);
        });
        socket.on(SocketEvent.ACCEPT_DRAW, (payload: AcceptDrawPayload) => {
            acceptDrawHandler(io, socket, payload, gameEngines, socketsByPlayerId, tournaments, specialGames, variantRegistry);
        });
        socket.on(SocketEvent.DECLINE_DRAW, (payload: DeclineDrawPayload) => {
            declineDrawHandler(io, socket, payload, gameEngines);
        });
        socket.on(SocketEvent.OFFER_UNDO, (payload: OfferUndoPayload) => {
            offerUndoHandler(io, socket, payload, gameEngines);
        });
        socket.on(SocketEvent.ACCEPT_UNDO, (payload: AcceptUndoPayload) => {
            acceptUndoHandler(io, socket, payload, gameEngines);
        });
        socket.on(SocketEvent.DECLINE_UNDO, (payload: DeclineUndoPayload) => {
            declineUndoHandler(io, socket, payload);
        });
        socket.on(SocketEvent.RESIGN, (payload: ResignPayload) => {
            resignHandler(io, socket, payload, gameEngines, socketsByPlayerId, tournaments, specialGames, variantRegistry);
        });

        socket.on("disconnect", () => {
            disconnectHandler(io, socket, socketsById, socketsByPlayerId);
        });
    });
}
