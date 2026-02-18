interface LobbyButtonProps {
    event: () => void,
    text: string,
}


export const LobbyButton = ({ event, text }: LobbyButtonProps) => {
    return (
        <button
            className="px-6 py-2 inline-flex items-center justify-center rounded-xl bg-red-600 text-white font-semibold shadow-sm hover:bg-red-600/85 transition"
            onClick={event}
        >
            {text}
        </button>
    )
}
