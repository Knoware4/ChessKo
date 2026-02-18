import { auth } from "../firebase";
import axiosInstance from "./base";


export const getGame = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/games/${id}`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.item;
}

export const getGameState = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/games/${id}/states`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getPlayersGames = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/players/${id}/games`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getSpecialGames = async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/specialGames`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getSpecialGame = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/specialGames/${id}`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.item;
}

export const getSpecialGameGames = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/specialGames/${id}/games`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getSpecialGamePlayers = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/specialGames/${id}/players`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getLeaderboard = async (specialGameId: string, roundIndex: number) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/specialgames/${specialGameId}/leaderboard`, {
        params: { specialGameRoundIndex: roundIndex },
        headers: {
            'Authorization': token,
        },
    }, )
    return response.data.items
}
