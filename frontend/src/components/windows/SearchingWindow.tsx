import { Loader2 } from "lucide-react";
import { FaChessBishop } from "react-icons/fa";
import { StopSearchingPayload } from "../../sockets/socketPayloads";
import { SocketEvent } from "../../sockets/socketEvents";
import { useContext } from "react";
import { Context } from "../../App";
import { StopButton } from "../../buttons/stopButton";


interface SearchingWindowProps {
    setIsSearching: React.Dispatch<React.SetStateAction<boolean>>
}


export const SearchingWindow = ({ setIsSearching }: SearchingWindowProps) => {
    const { socket, player } = useContext(Context);

    function stopSearchingGame() {
        setIsSearching(false);

        if (socket?.id && player) {
            const payload: StopSearchingPayload = {
                socketId: socket.id,
                playerId: player?.id,
            }
            socket?.emit(SocketEvent.STOP_SEARCHING, payload);
        }
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div 
                className="bg-white rounded-2xl bg-background shadow-lg p-6 flex flex-col items-center gap-3 border border-primary">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div 
                    className="flex space-x-1">
                    <FaChessBishop className="w-5 h-5" /><p className="text-primary font-medium">Looking for a game...</p>
                </div>
                <StopButton event={stopSearchingGame} />
            </div>
        </div>
    )
}
