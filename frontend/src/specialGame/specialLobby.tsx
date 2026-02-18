import { LobbyButton } from "../buttons/lobbyButton";
import { socket } from "../socket";
import { SocketEvent } from "../sockets/socketEvents";
import { LeaveSpecialGamePayload, StartSpecialGamePayload } from "../sockets/socketPayloads";
import { Player } from "../types/player";
import { SpecialGame } from "../types/specialGame";
import { PlayerRow } from "./playerRow";


interface SpecialLobbyProps {
    specialGame: SpecialGame,
    players: Player[],
    myId: string,
}


export const SpecialLobby = ({ specialGame, players, myId }: SpecialLobbyProps) => {
    function leaveGame() {
        if (myId) {
            const payload: LeaveSpecialGamePayload = {
                playerId: myId,
                specialGameId: specialGame.id,
            };
            socket?.emit(SocketEvent.LEAVE_SPECIAL_GAME, payload);
        }
    }

    function startSpecialGame() {
        if (myId) {
            const payload: StartSpecialGamePayload = {
                playerId: myId,
                specialGameId: specialGame.id,
            };
            socket?.emit(SocketEvent.START_SPECIAL_GAME, payload);
        }
    }

    function cancelSpecialGame() {
        if (myId) {
            const payload: LeaveSpecialGamePayload = {
                playerId: myId,
                specialGameId: specialGame.id,
            };
            socket?.emit(SocketEvent.LEAVE_SPECIAL_GAME, payload);
        }
    }

    return (
        <div
            className="bg-gray-100 py-10">
            <div
                className="container mx-auto px-4 flex flex-col">
                <div
                    className="text-3xl text-primary font-semibold text-center">
                    {specialGame.name}
                </div>
                <div
                    className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {specialGame.owner.id === myId ? (
                        <>
                            <LobbyButton event={startSpecialGame} text={"Start " + specialGame.name} />
                            <LobbyButton event={cancelSpecialGame} text={"Cancel " + specialGame.name} />

                        </>
                    ) : (
                        <LobbyButton event={leaveGame} text={"Leave " + specialGame.name} />
                    )}
                </div>

                <div
                    className="mt-5 w-full max-w-md mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
                    <div
                        className="divide-y divide-gray-200">
                        {players?.map((playerItem, key) => (
                            <PlayerRow player={playerItem}
                                timeControl={specialGame.timeControl}
                                key={key}
                                deleteButton={specialGame.owner.id === myId}
                                specialGameId={specialGame.id}
                                ownerId={specialGame.owner.id}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
