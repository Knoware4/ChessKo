import { useQuery } from "@tanstack/react-query";
import { Game } from "../types/game";
import { SpecialGame } from "../types/specialGame";
import { Player } from "../types/player";
import { LeaderboardItem } from "../types/leaderboardItem";
import { GamesApi } from "../sevices";


export function useGame(id?: string) {
	return useQuery<Game>({
		queryKey: ['games', id],
		queryFn: () => GamesApi.getGame(id!),
		enabled: !!id,
	});
}

export function usePlayersGames(playerId?: string) {
	return useQuery<Game[]>({
		queryKey: ['games', playerId],
		queryFn: () => GamesApi.getPlayersGames(playerId!),
		enabled: !!playerId,
	});
}

export function useSpecialGames() {
	return useQuery<SpecialGame[]>({
		queryKey: ['games'],
		queryFn: () => GamesApi.getSpecialGames(),
		refetchInterval: 3000,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});
}

export function useSpecialGame(id?: string) {
	return useQuery<SpecialGame>({
		queryKey: ['games', id],
		queryFn: () => GamesApi.getSpecialGame(id!),
		enabled: !!id,
	});
}

export function useSpecialGamePlayers(id?: string) {
	return useQuery<Player[]>({
		queryKey: ['games', id, 'players'],
		queryFn: () => GamesApi.getSpecialGamePlayers(id!),
		enabled: !!id,
	});
}

export function useLeaderboard(specialGameId: string | undefined, roundIndex: number) {
	return useQuery<LeaderboardItem[]>({
		queryKey: ['leaderboard', roundIndex],
		queryFn: () => GamesApi.getLeaderboard(specialGameId!, roundIndex),
		enabled: !!specialGameId,
	});
}
