import { FaTrash } from "react-icons/fa";


interface DeleteButtonProps {
    event: () => void,
}


export const DeleteButton = ({ event }: DeleteButtonProps) => {
    return (
        <button
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
            type="button"
            onClick={event}
            aria-label="Kick player"
        >
            <FaTrash />
        </button>
    )
}
