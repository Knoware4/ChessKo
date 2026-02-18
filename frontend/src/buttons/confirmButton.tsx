interface ConfirmButtonProps {
    text: string,
}


export const ConfirmButton = ({ text }: ConfirmButtonProps) => {
    return (
        <button
            className="px-6 py-2 inline-flex rounded-b-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
            type="submit">
            <div
                className="mx-auto">
                {text}
            </div>
        </button>
    )
}
