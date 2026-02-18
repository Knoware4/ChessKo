import { FormProvider, useFormContext } from "react-hook-form";
import { SpecialChessForm } from "../types/forms/specialChessForm";
import { PlaceholderInput } from "../inputs/placeholderInput";
import { UpgradeKey, VariantKey } from "../types/enums/enums";
import { MatchTypeButton } from "../buttons/matchTypeButton";
import { useContext, useEffect, useState } from "react";
import { Context } from "../App";
import { CreateSpecialGamePayload, SpecialGameCreatedPayload } from "../sockets/socketPayloads";
import { socket } from "../socket";
import { SocketEvent } from "../sockets/socketEvents";
import { SpecialChessConfiguration } from "../types/specialConfiguration";
import { useNavigate } from "react-router-dom";
import { Loading } from "../components/loading";
import { ConfirmButton } from "../buttons/confirmButton";
import { VariantSwitch } from "./variantSwitch";
import { UpgradesSetter } from "./upgradesSetter";


export const CreateSpecialGame = () => {
    const { player } = useContext(Context);
    const createSpecialGameForm = useFormContext<SpecialChessForm>();
    const { register, handleSubmit, setValue, watch } = createSpecialGameForm;
    const [isCreatingSpecialGame, setIsCreatingSpecialGame] = useState(false);

    const options: { label: string, value: VariantKey }[] = [
        {
            label: "Classical",
            value: "CLASSICAL",
        },
        {
            label: "Chess960",
            value: "CHESS960",
        },
        {
            label: "KingOfTheHill",
            value: "KING_OF_THE_HILL",
        },
        {
            label: "ThreeCheck",
            value: "THREE_CHECK",
        },
    ]

    function createSpecialGame(data: SpecialChessForm) {
        if (isNaN(data.tcMinutes) || isNaN(data.tcBonus) || data.name.length < 3) {
            return
        }
        setIsCreatingSpecialGame(true);
        if (player) {
            const config: SpecialChessConfiguration = {
                upgradeKeys: [
                    ...(data.timeCheck ? ["TIME_CHECK" as UpgradeKey] : []),
                    ...(data.extraTurn ? ["EXTRA_TURN" as UpgradeKey] : []),
                    ...(data.pawnDash ? ["PAWN_DASH" as UpgradeKey] : []),
                    ...(data.jumpOver ? ["JUMP_OVER" as UpgradeKey] : [])
                ],
                variantKey: data.variantKey,
            }
            const configJson: string = JSON.stringify(config);

            const payload: CreateSpecialGamePayload = {
                name: data.name,
                matchType: data.matchType,
                playerId: player.id,
                tcBonus: data.tcBonus,
                tcMinutes: data.tcMinutes,
                specialConfiguration: configJson,
            }
            console.log(configJson)
            socket?.emit(SocketEvent.CREATE_SPECIAL_GAME, payload);
        }
    }

    const navigate = useNavigate();

    useEffect(() => {
        function specialGameCreated(payload: SpecialGameCreatedPayload) {
            navigate("/special/" + payload.specialGameId);
        }

        socket?.on(SocketEvent.SPECIAL_GAME_CREATED, specialGameCreated);

        return () => {
            socket?.off(SocketEvent.SPECIAL_GAME_CREATED, specialGameCreated);
        };
    });

    return (
        <div
            className="">
            <div
                className="text-3xl text-primary font-semibold text-center mb-6">
                Create Special Game
            </div>

            <form
                className="flex flex-col gap-3" onSubmit={handleSubmit(createSpecialGame)}>
                <PlaceholderInput<SpecialChessForm> isRequired={true} placeholderText="Special game name" register={register} valueName="name" isNum={false} isPwd={false} />
                <VariantSwitch
                    onChange={(v) => setValue("variantKey", v as VariantKey)}
                    options={options}
                    value={watch("variantKey")}
                />
                <FormProvider {...createSpecialGameForm}>
                    <div>
                        <MatchTypeButton />
                    </div>
                    <UpgradesSetter />
                </FormProvider>
                <div
                    className="flex flex-col sm:flex-row gap-3 w-full">
                    <PlaceholderInput<SpecialChessForm> isRequired={true} placeholderText="Minutes" register={register} valueName="tcMinutes" isNum={true} isPwd={false} />
                    <PlaceholderInput<SpecialChessForm> isRequired={true} placeholderText="Bonus" register={register} valueName="tcBonus" isNum={true} isPwd={false} />
                </div>
                {
                    !isCreatingSpecialGame &&
                    <ConfirmButton text="Create Special Game" />
                }
                {
                    isCreatingSpecialGame &&
                    <Loading text="Creating special game" full={false} />
                }

            </form>
        </div>
    )
}
