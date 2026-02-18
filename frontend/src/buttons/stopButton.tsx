import { FaChessKing } from "react-icons/fa";


interface StopButtonProps {
    event: () => void
}


export const StopButton = ({ event }: StopButtonProps) => {
    return (
        <button
            className="px-6 py-2 inline-flex rounded-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
            onClick={() => event()}
        >
            Stop
            <FaChessKing 
                className="w-5 h-5 ml-1" />
        </button>
    )
}
