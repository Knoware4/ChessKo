interface PaginationButtonProps {
    text: string,
    disabled: boolean,
    setPage: () => void,
}


export const PaginationButton = ({ text, disabled, setPage }: PaginationButtonProps) => {
    return (
        <button
            className={`px-3 py-1 rounded border bg-primary text-white`}
            disabled={disabled}
            onClick={setPage}
        >
            {text}
        </button>
    )
}
