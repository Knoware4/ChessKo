import { useNavigate } from "react-router-dom";
import { Tournament } from "../types/tournament";
import { JoinTournamentPayload, TournamentJoinedPayload } from "../sockets/socketPayloads";
import { SocketEvent } from "../sockets/socketEvents";
import { socket } from "../socket";
import { Context } from "../App";
import { useContext, useEffect } from "react";
import { JoinButton } from "../buttons/joinButton";


interface TournamentRowProps {
    tournament: Tournament,
}


export const TournamentRow = ({ tournament }: TournamentRowProps) => {
    const { player } = useContext(Context);

    function joinTournament() {
        if (player) {
            const payload: JoinTournamentPayload = {
                playerId: player?.id,
                tournamentId: tournament.id,
            };
            socket?.emit(SocketEvent.JOIN_TOURNAMENT, payload);
        }
    }

    const navigate = useNavigate();

    useEffect(() => {
        function tournamentJoined(payload: TournamentJoinedPayload) {
            navigate("/tournaments/" + payload.tournamentId);
        }

        socket?.on(SocketEvent.TOURNAMENT_JOINED, tournamentJoined);

        return () => {
            socket?.off(SocketEvent.TOURNAMENT_JOINED, tournamentJoined);
        };
    }, [navigate]);

    return (
        <div>
            <div
                className="flex flex-wrap items-center justify-between w-full max-w-7xl mx-auto border shadow-sm bg-white">
                <div
                    className="flex flex-1 min-w-0">
                    <div
                        className="flex-1 min-w-[140px] text-sm font-semibold text-left py-2 px-2 bg-primary">
                        <div
                            className="text-ternary truncate">
                            {tournament.name}
                        </div>
                    </div>

                    <div
                        className="basis-24 shrink-0 text-sm font-semibold text-center py-2 px-2 bg-ternary">
                        <div
                            className="text-primary">
                            {tournament.timeControl}
                        </div>
                    </div>

                    <div
                        className="basis-24 shrink-0 flex space-x-1 py-2 px-2 bg-secondary justify-center">
                        <div
                            className="text-sm font-semibold text-ternary text-center">
                            {tournament.tcMinutes}
                        </div>
                        <div
                            className="text-sm font-semibold text-ternary text-center">
                            +
                        </div>
                        <div
                            className="text-sm font-semibold text-ternary text-center">
                            {tournament.tcBonus}
                        </div>
                    </div>

                    <div
                        className="basis-24 shrink-0 text-sm font-semibold text-center py-2 px-2 bg-ternary">
                        <div
                            className="text-primary">
                            {tournament.gameMode}
                        </div>
                    </div>
                </div>

                <div
                    className="flex items-center flex-shrink-0">
                    <div
                        className="w-24 flex px-4 py-2">
                        {tournament.numberOfPlayers} / 32
                    </div>
                    <JoinButton event={joinTournament} />
                </div>
            </div>
        </div>
    );
};
