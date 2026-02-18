import { useContext, useEffect } from "react"
import { Context } from "../App"
import { useSpecialGames } from "../hooks/useGame";
import { Loading } from "../components/loading";
import { Error } from "../components/error"
import { Navigate, useNavigate } from "react-router-dom";
import { SpecialGameJoinedPayload } from "../sockets/socketPayloads";
import { socket } from "../socket";
import { SocketEvent } from "../sockets/socketEvents";
import { usePlayerConfigurations } from "../hooks/usePlayer";
import { SpecialChessForm } from "../types/forms/specialChessForm";
import { FormProvider, useForm } from "react-hook-form";
import { SpecialGameHeader } from "../specialGame/specialGameHeader";
import { CreateSpecialGame } from "../specialGame/createSpecialGame";
import { SpecialGameRow } from "../specialGame/specialGameRow";
import { SpecialConfigRow } from "../userPageComponents/userSpecialConfigs";
import { Description } from "../specialGame/description";


export const SpecialChess = () => {
    const { player } = useContext(Context);

    const { data: specialGames, isLoading, error } = useSpecialGames();
    const { data: specialConfigurations, isLoading: isLoadingSpecialConfiguration, error: errorSpecialConfiguration } = usePlayerConfigurations(player?.id);

    const navigate = useNavigate();

    useEffect(() => {
        function specialGameJoined(payload: SpecialGameJoinedPayload) {
            navigate("/special/" + payload.specialGameId);
        }

        socket?.on(SocketEvent.SPECIAL_GAME_JOINED, specialGameJoined);

        return () => {
            socket?.off(SocketEvent.SPECIAL_GAME_JOINED, specialGameJoined);
        };
    }, [navigate]);

    const createSpecialGameForm = useForm<SpecialChessForm>({
        defaultValues: {
            variantKey: "CLASSICAL",
            matchType: "RATED",
        },
    });

    if (player?.ongoingGameId) return <Navigate to={`/games/${player.ongoingGameId}`} replace />
    if (player?.ongoingSpecialGameId) return <Navigate to={`/special/${player.ongoingSpecialGameId}`} replace />

    if (isLoading || !specialGames || !specialConfigurations || isLoadingSpecialConfiguration) return <Loading />
    if (error || errorSpecialConfiguration) return <Error />

    return (
        <div
            className="flex flex-col bg-gray-100 min-h-screen py-10">
            <div>
                <div
                    className="text-3xl text-primary font-semibold text-center">
                    Special Chess
                </div>
                <div>
                    {
                        !player?.ongoingTournamentId &&
                        <div
                            className="mt-5 w-full">
                            <div
                                className="max-w-4xl mx-auto">
                                <div
                                    className="flex flex-col items-stretch">
                                    <SpecialGameHeader />
                                    {specialGames?.filter((specialGame) => !specialGame.startedAt).map((specialGame, key) => (
                                        <SpecialGameRow specialGame={specialGame} key={key} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    }
                </div>
                <FormProvider {...createSpecialGameForm}>
                    <div
                        className="w-full mt-10">
                        <div
                            className="text-3xl text-primary font-semibold text-center">
                            Special Configurations
                        </div>
                        <div
                            className="max-w-4xl mx-auto">
                            <div
                                className="flex flex-col items-stretch">
                                <SpecialGameHeader short={true} />
                                {
                                    specialConfigurations.map((config, key) => (
                                        <SpecialConfigRow config={config} key={key} load={true} setValue={createSpecialGameForm.setValue} />
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    <div
                        className="flex justify-center mt-5">
                        <div
                            className="flex flex-col gap-6 p-8 rounded-xl shadow-lg bg-white">
                            <CreateSpecialGame />
                        </div>
                    </div>
                </FormProvider>
                <div className="flex flex-col items-center mt-10">
                    <Description />
                </div>
            </div>
        </div>
    )
}
