import { useQuery } from "@tanstack/react-query";
import { Tournament } from "../types/tournament";
import { Game } from "../types/game";
import { Player } from "../types/player";
import { LeaderboardItem } from "../types/leaderboardItem";
import { PlayersApi, TournamentsApi } from "../sevices";


export function useTournament(id?: string) {
    return useQuery<Tournament>({
        queryKey: ['tournaments', id],
        queryFn: () => TournamentsApi.getTournament(id!),
        enabled: !!id,
    });
}

export function useTournaments() {
    return useQuery<Tournament[]>({
        queryKey: ["tournaments"],
        queryFn: TournamentsApi.getTournaments,
        refetchInterval: 3000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });
}

export function usePlayersTournaments(playerId?: string) {
    return useQuery<Tournament[]>({
        queryKey: ['tournaments', playerId],
        queryFn: () => PlayersApi.getPlayersTournaments(playerId!),
        enabled: !!playerId,
    });
}

export function useGames(id?: string) {
    return useQuery<Game[]>({
        queryKey: ['games'],
        queryFn: () => TournamentsApi.getTournamentGames(id!),
        enabled: !!id,
    });
}

export function usePlayers(id?: string) {
    return useQuery<Player[]>({
        queryKey: ['players'],
        queryFn: () => TournamentsApi.getTournamentPlayers(id!),
        enabled: !!id,
    });
}

export function useLeaderboard(tournamentId: string | undefined, roundIndex: number) {
    return useQuery<LeaderboardItem[]>({
        queryKey: ['leaderboard', roundIndex],
        queryFn: () => TournamentsApi.getLeaderboard(tournamentId!, roundIndex),
        enabled: !!tournamentId,
    });
}
