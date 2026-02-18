import { useEffect } from "react";
import { socket } from "../socket";
import { Player } from "../types/player";
import { SocketEvent } from "../sockets/socketEvents";
import {
    SocketIdentificationPayload,
    SpecialGameGameStartedPayload,
    TournamentFinishedPayload,
    TournamentGameStartedPayload,
} from "../sockets/socketPayloads";
import { useNavigate } from "react-router-dom";


export function useSocket(player: Player | undefined) {
    const navigate = useNavigate();

    useEffect(() => {
        if (player && !socket.connected) {
            socket.connect();
            const payload: SocketIdentificationPayload = { playerId: player.id };
            socket.emit(SocketEvent.SOCKET_IDENTIFICATION, payload);
        }
    });

    useEffect(() => {
        function NextGame(payload: TournamentGameStartedPayload) {
            console.log("NEXT GAME FOR PLAYER", player?.id, payload.gameId);
            navigate("/games/" + payload.gameId);
        }

        function Finish(payload: TournamentFinishedPayload) {
            navigate("/tournaments/" + payload.tournamentId);
        }

        function NextSpecialGame(payload: SpecialGameGameStartedPayload) {
            navigate("/games/" + payload.gameId);
        }

        socket.on(SocketEvent.TOURNAMENT_GAME_STARTED, NextGame);
        socket.on(SocketEvent.TOURNAMENT_FINISHED, Finish);
        socket.on(SocketEvent.SPECIAL_GAME_GAME_STARTED, NextSpecialGame);

        return () => {
            socket.off(SocketEvent.TOURNAMENT_GAME_STARTED, NextGame);
            socket.off(SocketEvent.TOURNAMENT_FINISHED, Finish);
            socket.on(SocketEvent.SPECIAL_GAME_GAME_STARTED, NextSpecialGame);
        };
    }, [navigate, player]);

    return socket;
}
