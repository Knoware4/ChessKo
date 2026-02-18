import { FaPlay } from "react-icons/fa";


interface JoinButtonProps {
    event: () => void,
}


export const JoinButton = ({ event }: JoinButtonProps) => {
    return (
        <button
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-l-lg hover:bg-secondary transition-colors"
            onClick={event}
        >
            <span>JOIN</span>
            <FaPlay className="w-4 h-4" />
        </button>
    )
}
