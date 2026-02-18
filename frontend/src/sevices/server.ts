import axiosInstance from "./base";


export const checkBackendAlive = async () => {
    const response = await axiosInstance.get(`/`);
    return response.data;
};
