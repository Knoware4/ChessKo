import { useContext, useState } from "react";
import { SpecialConfigurationNormal } from "../types/specialConfigurationNormal";
import { Pagination } from "../components/pagination";
import { SpecialGameHeader } from "../specialGame/specialGameHeader";
import { FaSave, FaUpload } from "react-icons/fa";
import { SocketEvent } from "../sockets/socketEvents";
import { socket } from "../socket";
import { Context } from "../App";
import { SaveConfigurationPayload } from "../sockets/socketPayloads";
import { SpecialChessForm } from "../types/forms/specialChessForm";
import { UseFormSetValue } from "react-hook-form";
import { SmallButton2 } from "../buttons/smallButton2";


interface UserSpecialConfigsProps {
    configurations: SpecialConfigurationNormal[],
}


export const UserSpecialConfigs = ({ configurations }: UserSpecialConfigsProps) => {
    const [page, setPage] = useState(0);

    return (
        <div>
            <div
                className="text-3xl text-primary font-semibold text-center">
                Special Configs
            </div>
            <div
                className="">
                <div
                    className="w-full">
                    <div
                        className="max-w-4xl mx-auto">
                        <div
                            className="flex flex-col items-stretch">
                            <SpecialGameHeader short={true} />
                            {
                                configurations.slice(page * 10, page * 10 + 10).map((config, key) => (
                                    <SpecialConfigRow config={config} key={key} />
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
            <div
                className="mt-2">
                <Pagination page={page} setPage={setPage} maxPages={Math.ceil(configurations.length / 10 - 1)} />
            </div>
        </div>
    )
}

interface SpecialConfigRowProps {
    config: SpecialConfigurationNormal,
    load?: boolean,
    setValue?: UseFormSetValue<SpecialChessForm>,
}

export const SpecialConfigRow = ({ config, load = false, setValue }: SpecialConfigRowProps) => {
    const { player } = useContext(Context);

    function saveConfig() {
        if (player) {
            const payload: SaveConfigurationPayload = {
                playerId: player?.id,
                specialConfigurationId: config.id,
            };
            socket?.emit(SocketEvent.SAVE_CONFIGURATION, payload);
        }
    }

    function loadConfiguration() {
        if (setValue) {
            setValue("extraTurn", config.upgradeKeys.includes("EXTRA_TURN"));
            setValue("jumpOver", config.upgradeKeys.includes("JUMP_OVER"));
            setValue("pawnDash", config.upgradeKeys.includes("PAWN_DASH"));
            setValue("timeCheck", config.upgradeKeys.includes("TIME_CHECK"));
            setValue("variantKey", config.variantKey);
        }
    }

    return (
        <div
            className="bg-white grid grid-cols-9 border border-ternary">
            <SpecialGameRowItem text={config.name} gridColumn="col-span-2" />
            <SpecialGameRowItem text={config?.variantKey} gridColumn="col-span-2" />
            <SpecialGameRowItem text={config.upgradeKeys.includes("EXTRA_TURN") ? "E" : ""} gridColumn="col-span-1" />
            <SpecialGameRowItem text={config.upgradeKeys.includes("JUMP_OVER") ? "J" : ""} gridColumn="col-span-1" />
            <SpecialGameRowItem text={config.upgradeKeys.includes("PAWN_DASH") ? "P" : ""} gridColumn="col-span-1" />
            <SpecialGameRowItem text={config.upgradeKeys.includes("TIME_CHECK") ? "T" : ""} gridColumn="col-span-1" />
            {!load &&
                <SmallButton2 event={saveConfig}>
                    <FaSave />
                </SmallButton2>
            }
            {load &&
                <SmallButton2 event={loadConfiguration}>
                    <FaUpload />
                </SmallButton2>
            }
        </div>
    )
}

interface SpecialGameRowItemProps {
    text?: string,
    gridColumn: string,
}

const SpecialGameRowItem = ({ text, gridColumn }: SpecialGameRowItemProps) => {
    return (
        <div className={`flex items-center justify-center px-3 py-2 border-r border-gray-200 ${gridColumn}`}>{text}</div>
    )
}
