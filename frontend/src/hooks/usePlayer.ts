import { useQuery } from "@tanstack/react-query";
import { Player } from "../types/player";
import { SpecialGame } from "../types/specialGame";
import { SpecialConfigurationNormal } from "../types/specialConfigurationNormal";
import { PlayersApi } from "../sevices";


export function usePlayer(id?: string | undefined | null) {
	return useQuery<Player>({
		queryKey: ['players', id],
		queryFn: () => PlayersApi.getPlayer(id!),
		enabled: !!id,
	});
}

export function usePlayerByEmail(email: string | null) {
	return useQuery<Player>({
		queryKey: ["players", email],
		queryFn: () => PlayersApi.getPlayerByEmail(email!),
		enabled: !!email,
		refetchInterval: 5000,
	});
}

export function usePlayers() {
	return useQuery<Player[]>({
		queryKey: ["players"],
		queryFn: PlayersApi.getPlayers,
	});
}

export function usePlayerSpecialGames(playerId?: string) {
	return useQuery<SpecialGame[]>({
		queryKey: ['specialgames'],
		queryFn: () => PlayersApi.getPlayersSpecialGames(playerId!),
		enabled: !!playerId,
	});
}

export function usePlayerConfigurations(playerId?: string) {
	return useQuery<SpecialConfigurationNormal[]>({
		queryKey: ['configurations'],
		queryFn: () => PlayersApi.getPlayersConfigurations(playerId!),
		enabled: !!playerId,
	});
}
