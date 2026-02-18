import { FaChessKing } from "react-icons/fa";


export const PlayButton = () => {
    return (
        <button
            className="px-6 py-2 inline-flex rounded-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
            type="submit"
        >
            Play
            <FaChessKing className="w-5 h-5 ml-1" />
        </button>
    );
};
