import { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Context } from "../App";
import { useGames, useLeaderboard, usePlayers, useTournament } from "../hooks/useTournament";
import { SocketEvent } from "../sockets/socketEvents";
import { KickedFromTournamentPayload, LeaveTournamentPayload } from "../sockets/socketPayloads";
import { Loading } from "../components/loading";
import { Error } from "../components/error"
import { LobbyFinish } from "../tournaments/lobbyFinish";
import { Lobby } from "../tournaments/lobby";
import { RoundsInTournament } from "../tournaments/RoundsInTournament";
import { Leaderboard } from "../tournaments/leaderboard";
import { Canceled } from "../tournaments/canceled";


export const TournamentPage = () => {
    const { id } = useParams<{ id: string }>();
    const { player, socket } = useContext(Context);

    const { data: tournament, isLoading: isLoadingTournament, error: tournamentError, refetch: refetchTournament } = useTournament(id);
    const { data: players, isLoading: isLoadingPlayers, error: playersError, refetch: refetchPlayers } = usePlayers(id);
    const { data: games, isLoading: isLoadingGames, error: gamesError, refetch: refetchGames, isRefetching: isRefetchingGames } = useGames(id);

    const [canceled, setCanceled] = useState<boolean>();

    const [round, setRound] = useState(tournament?.currentRoundIndex ?? 0);
    const { data: leaderboardItems, isLoading: isLoadingLeaderboardItems, error: leaderboardItemsError } = useLeaderboard(id, round);

    const navigate = useNavigate();

    useEffect(() => {
        function SomebodyJoinedTournament() {
            refetchPlayers();
        }

        function SomebodyLeftTournament(payload: LeaveTournamentPayload) {
            refetchPlayers();
            if (player && payload.playerId === player.id) {
                navigate("/");
            }
        }

        function SomebodyWasKicked(payload: KickedFromTournamentPayload) {
            refetchPlayers();
            if (player && payload.playerId === player.id) {
                navigate("/");
            }
        }

        function CanceledTournament() {
            setCanceled(true);
        }

        function TournamentStarted() {
            refetchTournament();
            refetchGames();
        }

        socket?.on(SocketEvent.TOURNAMENT_STARTED, TournamentStarted);
        socket?.on(SocketEvent.TOURNAMENT_JOINED, SomebodyJoinedTournament);
        socket?.on(SocketEvent.LEFT_TOURNAMENT, SomebodyLeftTournament);
        socket?.on(SocketEvent.KICKED_FROM_TOURNAMENT, SomebodyWasKicked);
        socket?.on(SocketEvent.TOURNAMENT_CANCELED, CanceledTournament);

        return () => {
            socket?.off(SocketEvent.TOURNAMENT_STARTED, TournamentStarted);
            socket?.off(SocketEvent.TOURNAMENT_JOINED, SomebodyJoinedTournament);
            socket?.off(SocketEvent.LEFT_TOURNAMENT, SomebodyLeftTournament);
            socket?.off(SocketEvent.KICKED_FROM_TOURNAMENT, SomebodyWasKicked);
            socket?.off(SocketEvent.TOURNAMENT_CANCELED, CanceledTournament);
        };
    }, [socket, player, navigate, refetchPlayers, refetchGames, refetchTournament]);

    if (isLoadingTournament || isLoadingPlayers || !player || isLoadingGames || isRefetchingGames || !leaderboardItems || isLoadingLeaderboardItems) return <Loading />
    if (tournamentError || playersError || gamesError || !tournament || !players || !games || leaderboardItemsError) return <Error />
    if (player?.ongoingGameId) return <Navigate to={`/games/${player.ongoingGameId}`} replace />
    if (canceled) return <Canceled text="This tournament was canceled..." />

    return (
        <div
            className="bg-gray-100 min-h-screen">
            {
                tournament.finishedAt &&
                <LobbyFinish winnerName={tournament.winner.nickname} />
            }
            {
                !tournament.startedAt &&
                <Lobby myId={player.id} players={players} tournament={tournament} />
            }
            {
                tournament.startedAt &&
                <div
                    className="flex flex-col space-y-5">
                    <RoundsInTournament games={games} tournament={tournament} round={round} setRound={setRound} />
                    <Leaderboard leaderboardItems={leaderboardItems} timeControl={tournament.timeControl} gameMode={tournament.gameMode} />
                </div>
            }
        </div>
    )
}
