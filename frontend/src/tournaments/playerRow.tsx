import { useContext } from "react";
import { KickFromTournamentPayload } from "../sockets/socketPayloads";
import { TimeControl } from "../types/enums/enums";
import { Player } from "../types/player";
import { Context } from "../App";
import { SocketEvent } from "../sockets/socketEvents";
import { FaChessKing } from "react-icons/fa"
import { DeleteButton } from "../buttons/deleteButton";

interface PlayerRowProps {
    timeControl: TimeControl,
    player: Player,
    deleteButton: boolean,
    tournamentId: string,
    ownerId: string,
}

export const PlayerRow = ({ player, timeControl, deleteButton, tournamentId, ownerId }: PlayerRowProps) => {
    const { player: me, socket } = useContext(Context);

    function kickPlayer() {
        if (player && me) {
            const payload: KickFromTournamentPayload = {
                kickerId: me.id,
                playerId: player.id,
                tournamentId: tournamentId,
            };
            socket?.emit(SocketEvent.KICK_FROM_TOURNAMENT, payload);
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
                    {timeControl === "BULLET" && player.eloRankedBullet}
                    {timeControl === "BLITZ" && player.eloRankedBlitz}
                    {timeControl === "RAPID" && player.eloRankedRapid}
                    {timeControl === "CLASSIC" && player.eloRankedClassic}
                </div>

                {deleteButton && (
                    <DeleteButton event={kickPlayer} />
                )}
            </div>
        </div>
    )
}
