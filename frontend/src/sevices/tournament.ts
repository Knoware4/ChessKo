import axiosInstance from "./base";
import { GameMode } from "../types/enums/enums";
import { auth } from "../firebase";


export const getTournament = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/tournaments/${id}`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.item;
}

export const getTournaments = async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/tournaments`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getTournamentGames = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/tournaments/${id}/games`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getTournamentPlayers = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/tournaments/${id}/players`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const createTournament = async (name: string, gameMode: GameMode, tcMinutes: number, tcBonus: number, playerId: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.post("/tournaments",
        {
            name,
            gameMode,
            tcMinutes,
            tcBonus,
            ownerId: playerId,
            playerIds: [
                playerId,
            ],
        },  {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items
}

export const getLeaderboard = async (tournamentId: string, roundIndex: number) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/tournaments/${tournamentId}/leaderboard`, {
        params: { tournamentRoundIndex: roundIndex },
        headers: {
            'Authorization': token,
        },
    }, )
    return response.data.items
}
