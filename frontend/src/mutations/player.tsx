import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlayersApi } from "../sevices";


export const RegisterPlayerMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {nickname: string, email: string}) => PlayersApi.createPlayer(data.nickname, data.email),
        onError: (error) => {
            console.error('Failed to create player: ', error);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['players']});
        },
    });
}
