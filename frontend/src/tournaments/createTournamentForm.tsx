import { useFormContext } from "react-hook-form";
import { useContext, useState } from "react";
import { CreateTournamentPayload } from "../sockets/socketPayloads";
import { SocketEvent } from "../sockets/socketEvents";
import { Context } from "../App";
import { PlaceholderInput } from "../inputs/placeholderInput";
import { Loading } from "../components/loading";
import { ConfirmButton } from "../buttons/confirmButton";
import { CreateTournamentFormType } from "../types/forms/tournamentForm";


export const CreateTournamentForm = () => {
    const { socket, player } = useContext(Context);
    const { register, handleSubmit } = useFormContext<CreateTournamentFormType>();
    const [isCreatingTournament, setIsCreatingTournament] = useState(false);

    function createTournament(data: CreateTournamentFormType) {
        if (isNaN(data.tcMinutes) || isNaN(data.tcBonus) || data.name.length < 3) {
            return
        }
        setIsCreatingTournament(true);
        if (player) {
            const payload: CreateTournamentPayload = {
                name: data.name,
                playerId: player?.id,
                tcBonus: data.tcBonus,
                tcMinutes: data.tcMinutes,
            };
            socket?.emit(SocketEvent.CREATE_TOURNAMENT, payload);
        }
    }

    return (
        <div
            className="flex justify-center mt-10">
            <div
                className="w-full max-w-lg md:max-w-xl bg-white shadow-md rounded-2xl p-6">
                <div
                    className="text-3xl text-primary font-semibold text-center mb-6">
                    Create Tournament
                </div>

                <form
                    className="flex flex-col gap-3" onSubmit={handleSubmit(createTournament)}>
                    <PlaceholderInput<CreateTournamentFormType> isRequired={true} placeholderText="Tournament name" register={register} valueName="name" isNum={false} isPwd={false} />
                    <div
                        className="flex flex-col sm:flex-row gap-3 w-full">
                        <PlaceholderInput<CreateTournamentFormType> isRequired={true} placeholderText="Minutes" register={register} valueName="tcMinutes" isNum={true} isPwd={false} />
                        <PlaceholderInput<CreateTournamentFormType> isRequired={true} placeholderText="Bonus" register={register} valueName="tcBonus" isNum={true} isPwd={false} />
                    </div>
                    {
                        !isCreatingTournament &&
                        <ConfirmButton text="Create Tournament" />
                    }
                    {
                        isCreatingTournament &&
                        <Loading text="Creating tournament" full={false} />
                    }
                </form>
            </div>
        </div>
    )
}
