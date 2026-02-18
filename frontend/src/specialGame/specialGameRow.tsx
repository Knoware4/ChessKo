import { useContext } from "react";
import { SpecialGame } from "../types/specialGame";
import { Context } from "../App";
import { JoinSpecialGamePayload } from "../sockets/socketPayloads";
import { socket } from "../socket";
import { SocketEvent } from "../sockets/socketEvents";
import { FaPlay } from "react-icons/fa";
import { UpgradeKey, VariantKey } from "../types/enums/enums";


interface SpecialGameRowProps {
    specialGame: SpecialGame
}


export const SpecialGameRow = ({ specialGame }: SpecialGameRowProps) => {
    const { player } = useContext(Context);

    type ObjectWithIdOnly = {
        id: string;
    }
    type SpecialConfigurationNormal = ObjectWithIdOnly & {
        name: string;
        variantKey: VariantKey;
        upgradeKeys: UpgradeKey[];
    }
    function des(serialize?: string) {
        if (serialize) {
            return JSON.parse(serialize.toString()) as SpecialConfigurationNormal;
        }
        return undefined
    }

    const specialConfiguration = typeof specialGame.specialConfiguration === "string" ? des(specialGame.specialConfiguration) : specialGame.specialConfiguration
    const extraTurn = specialConfiguration?.upgradeKeys.includes("EXTRA_TURN");
    const jumpOver = specialConfiguration?.upgradeKeys.includes("JUMP_OVER");
    const pawnDash = specialConfiguration?.upgradeKeys.includes("PAWN_DASH");
    const timeCheck = specialConfiguration?.upgradeKeys.includes("TIME_CHECK");

    function JoinGame() {
        if (player) {
            const payload: JoinSpecialGamePayload = {
                playerId: player.id,
                specialGameId: specialGame.id,
            }
            socket?.emit(SocketEvent.JOIN_SPECIAL_GAME, payload);
        }
    }

    return (
        <div
            className="grid grid-cols-12 bg-white  ">
            <SpecialGameRowItem text={specialGame.name} gridColumn="col-span-2" />
            <SpecialGameRowItem text={specialGame.owner.nickname} gridColumn="col-span-2" />
            <SpecialGameRowItem text={specialGame.tcMinutes + " + " + specialGame.tcBonus} gridColumn="col-span-1" />
            <SpecialGameRowItem text={specialConfiguration?.variantKey} gridColumn="col-span-2" />
            <SpecialGameRowItem text={extraTurn ? "E" : ""} gridColumn="col-span-1" />
            <SpecialGameRowItem text={jumpOver ? "J" : ""} gridColumn="col-span-1" />
            <SpecialGameRowItem text={pawnDash ? "P" : ""} gridColumn="col-span-1" />
            <SpecialGameRowItem text={timeCheck ? "T" : ""} gridColumn="col-span-1" />
            <button onClick={() => JoinGame()} className="col-span-1 flex items-center justify-center hover:bg-ternary"><FaPlay /></button>
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
