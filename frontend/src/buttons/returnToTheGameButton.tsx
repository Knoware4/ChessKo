import { useNavigate } from "react-router-dom";


interface ReturnToTheGameButtonProps {
    gameId: string,
}


export const ReturnToTheGameButton = ({ gameId }: ReturnToTheGameButtonProps) => {
    const navigate = useNavigate();

    function ReturnToTheGame() {
        navigate("/games/" + gameId);
    }

    return (
        <button
            className="px-6 py-2 inline-flex rounded-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
            type="submit"
            onClick={() => ReturnToTheGame()}
        >
            Return to the game
        </button>
    )
}
