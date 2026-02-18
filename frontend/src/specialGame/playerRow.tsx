import { useContext } from "react";
import { KickFromSpecialGamePayload } from "../sockets/socketPayloads";
import { TimeControl } from "../types/enums/enums";
import { Player } from "../types/player";
import { Context } from "../App";
import { SocketEvent } from "../sockets/socketEvents";
import { FaChessKing } from "react-icons/fa";
import { DeleteButton } from "../buttons/deleteButton";


interface PlayerRowProps {
    timeControl: TimeControl,
    player: Player,
    deleteButton: boolean,
    specialGameId: string,
    ownerId: string,
}


export const PlayerRow = ({ player, timeControl, deleteButton, specialGameId, ownerId }: PlayerRowProps) => {
    const { player: me, socket } = useContext(Context);

    function kickPlayer() {
        if (player && me) {
            const payload: KickFromSpecialGamePayload = {
                kickerId: me.id,
                playerId: player.id,
                specialGameId: specialGameId,
            }
            socket?.emit(SocketEvent.KICK_FROM_SPECIAL_GAME, payload);
        }
    }

    return (
        <div
            className="flex items-center justify-between px-4 py-3">
            <div
                className="flex items-center gap-2 min-w-0">
                <div
                    className="truncate text-gray-800 font-medium leading-none">
                    {player.nickname}
                </div>

                {player.id === ownerId && (
                    <span
                        className="inline-flex items-center justify-center leading-none">
                        <FaChessKing className="text-amber-500 text-lg align-middle" />
                    </span>
                )}
            </div>

            <div
                className="flex items-center gap-4">
                <div
                    className="text-sm text-gray-600 font-semibold">
                    {timeControl === "BULLET" && player.eloSpecialBullet}
                    {timeControl === "BLITZ" && player.eloSpecialBlitz}
                    {timeControl === "RAPID" && player.eloSpecialRapid}
                    {timeControl === "CLASSIC" && player.eloSpecialClassic}
                </div>

                {deleteButton && <DeleteButton event={kickPlayer} />}
            </div>
        </div>
    )
}
