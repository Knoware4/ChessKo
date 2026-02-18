import { auth } from "../firebase";
import axiosInstance from "./base";


export const getPlayers = async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/players/user`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getPlayer = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/players/${id}`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.item;
}

export const getPlayerByEmail = async (email: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/players/email/${email}`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.item;
}

export const getPlayersTournaments = async (playerId: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/players/${playerId}/tournaments`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getPlayersSpecialGames = async (playerId: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/players/${playerId}/specialGames`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const getPlayersConfigurations = async (playerId: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.get(`/players/${playerId}/configurations`, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data.items;
}

export const createPlayer = async (nickname: string, email: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await axiosInstance.post(`/players`, {
        nickname,
        email,
        role: "USER",
    }, {
        headers: {
            'Authorization': token,
        },
    });
    return response.data;
}
