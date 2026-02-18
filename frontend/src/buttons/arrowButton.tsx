interface ArrowButtonProps {
    event: () => void,
    children: React.ReactNode,
}


export const ArrowButton = ({ children, event }: ArrowButtonProps) => {
    return (
        <button 
            className="px-6 py-2 inline-flex rounded-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
            onClick={event}>
            {children}
        </button>
    )
}
