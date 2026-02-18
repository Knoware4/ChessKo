interface GameButtonProps {
    name: string,
    event: () => void,
}


export const GameButton = ({ name, event }: GameButtonProps) => {
    return (
        <button
            className="px-3 py-1 rounded-md bg-primary hover:bg-secondary text-white transition-colors"
            onClick={event}
        >
            {name}
        </button>
    )
}
