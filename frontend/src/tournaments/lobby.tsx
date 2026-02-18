import { LobbyButton } from "../buttons/lobbyButton";
import { socket } from "../socket";
import { SocketEvent } from "../sockets/socketEvents";
import { LeaveTournamentPayload, StartTournamentPayload } from "../sockets/socketPayloads";
import { Player } from "../types/player";
import { Tournament } from "../types/tournament";
import { PlayerRow } from "./playerRow";


interface LobbyProps {
    tournament: Tournament,
    players: Player[]
    myId: string,
}


export const Lobby = ({ tournament, players, myId }: LobbyProps) => {
    function leaveTournament() {
        if (myId) {
            const payload: LeaveTournamentPayload = {
                playerId: myId,
                tournamentId: tournament.id,
            };
            socket?.emit(SocketEvent.LEAVE_TOURNAMENT, payload);
        }
    }

    function startTournament() {
        if (myId) {
            const payload: StartTournamentPayload = {
                playerId: myId,
                tournamentId: tournament.id,
            };
            socket?.emit(SocketEvent.START_TOURNAMENT, payload);
        }
    }

    function cancelTournament() {
        if (myId) {
            const payload: LeaveTournamentPayload = {
                playerId: myId,
                tournamentId: tournament.id,
            };
            socket?.emit(SocketEvent.LEAVE_TOURNAMENT, payload);
        }
    }

    return (
        <div
            className="bg-gray-100 py-10">
            <div
                className="container mx-auto px-4 flex flex-col">
                <div
                    className="text-3xl text-primary font-semibold text-center">
                    {tournament.name}
                </div>
                <div
                    className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {tournament.owner.id === myId ? (
                        <>
                            <LobbyButton event={startTournament} text="Start tournament" />
                            <LobbyButton event={cancelTournament} text="Cancel tournament" />
                        </>
                    ) : (
                        <LobbyButton event={leaveTournament} text="Leave tournament" />
                    )}
                </div>

                <div
                    className="mt-5 w-full max-w-md mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
                    <div
                        className="divide-y divide-gray-200">
                        {players?.map((playerItem, key) => (
                            <PlayerRow player={playerItem}
                                timeControl={tournament.timeControl}
                                key={key}
                                deleteButton={tournament.owner.id === myId}
                                tournamentId={tournament.id}
                                ownerId={tournament.owner.id}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
