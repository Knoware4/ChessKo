interface ActionButtonProps {
    text: string,
    eventFunction: React.MouseEventHandler<HTMLButtonElement> | undefined,
}


export const ActionButton = ({ text, eventFunction }: ActionButtonProps) => {
    return (
        <button
            className="px-6 py-2 inline-flex rounded-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
            onClick={eventFunction}>
            {text}
        </button>
    )
}
