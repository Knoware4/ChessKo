interface ExportButtonProps {
    alertText: string,
    buttonText: string,
    pgn: string | undefined,
}


export const ExportButton = ({ alertText, buttonText, pgn }: ExportButtonProps) => {
    return (
        <button
            className="px-6 py-2 inline-flex rounded-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
            onClick={async () => {
                await navigator.clipboard.writeText(pgn ?? "");
                alert(alertText);
            }}>
            {buttonText}
        </button>
    )
}
