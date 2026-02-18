import { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Context } from "../App";
import { SocketEvent } from "../sockets/socketEvents";
import { KickedFromSpecialGamePayload, LeaveSpecialGamePayload, SpecialGameJoinedPayload } from "../sockets/socketPayloads";
import { Loading } from "../components/loading";
import { Error } from "../components/error"
import { useLeaderboard, useSpecialGame, useSpecialGamePlayers } from "../hooks/useGame";
import { Canceled } from "../tournaments/canceled";
import { SpecialLobby } from "../specialGame/specialLobby";
import { Leaderboard } from "../tournaments/leaderboard";


export const SpecialChessGame = () => {
    const { id } = useParams<{ id: string }>();
    const { player, socket } = useContext(Context);

    const { data: specialGame, isLoading: isLoadingSpecialGame, error: specialGameError, refetch: refetchSpecialGame } = useSpecialGame(id);
    const { data: players, isLoading: isLoadingPlayers, error: playersError, refetch: refetchPlayers } = useSpecialGamePlayers(id);
    const { data: leaderboardItems, isLoading: isLoadingLeaderboardItems, error: leaderboardItemsError } = useLeaderboard(id, 0);

    const [canceled, setCanceled] = useState<boolean>();

    const navigate = useNavigate();

    useEffect(() => {
        function SomebodyJoinedSpecialGame(payload: SpecialGameJoinedPayload) {
            refetchPlayers();
        }

        function SomebodyLeftSpecialGame(payload: LeaveSpecialGamePayload) {
            refetchPlayers();
            if (player && payload.playerId === player.id) {
                navigate("/");
            }
        }

        function SomebodyWasKicked(payload: KickedFromSpecialGamePayload) {
            refetchPlayers();
            if (player && payload.playerId === player.id) {
                navigate("/");
            }
        }

        function CanceledTournament() {
            setCanceled(true);
        }

        function SpecialGameStarted() {
            refetchSpecialGame();
        }

        socket?.on(SocketEvent.SPECIAL_GAME_STARTED, SpecialGameStarted);
        socket?.on(SocketEvent.SPECIAL_GAME_JOINED, SomebodyJoinedSpecialGame);
        socket?.on(SocketEvent.LEFT_SPECIAL_GAME, SomebodyLeftSpecialGame);
        socket?.on(SocketEvent.KICKED_FROM_SPECIAL_GAME, SomebodyWasKicked);
        socket?.on(SocketEvent.SPECIAL_GAME_CANCELED, CanceledTournament);

        return () => {
            socket?.off(SocketEvent.SPECIAL_GAME_STARTED, SpecialGameStarted);
            socket?.off(SocketEvent.SPECIAL_GAME_JOINED, SomebodyJoinedSpecialGame);
            socket?.off(SocketEvent.LEFT_SPECIAL_GAME, SomebodyLeftSpecialGame);
            socket?.off(SocketEvent.KICKED_FROM_SPECIAL_GAME, SomebodyWasKicked);
            socket?.off(SocketEvent.SPECIAL_GAME_CANCELED, CanceledTournament);
        };
    }, [socket, player, navigate, refetchPlayers, refetchSpecialGame]);

    if (isLoadingSpecialGame || isLoadingPlayers || !player || !leaderboardItems || isLoadingLeaderboardItems) return <Loading />
    if (specialGameError || playersError || !specialGame || !players || leaderboardItemsError) return <Error />
    if (player?.ongoingGameId) return <Navigate to={`/games/${player.ongoingGameId}`} replace />
    if (canceled) return <Canceled text="This game was canceled..." />

    return (
        <div
            className="bg-gray-100 min-h-screen">
            {
                !specialGame.startedAt &&
                <SpecialLobby myId={player.id} players={players} specialGame={specialGame} />
            }
            {
                specialGame.finishedAt &&
                <Leaderboard gameMode="SPECIAL" timeControl={specialGame.timeControl} leaderboardItems={leaderboardItems} />
            }
        </div>
    )
}
