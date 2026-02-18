interface SmallButtonProps {
    children: React.ReactNode, 
    event: () => void,
}


export const SmallButton = ({ children, event }: SmallButtonProps) => {
    return (
        <button
            className="rounded-lg bg-ternary px-4 py-2 font-semibold hover:bg-blue-200 hover:text-white"
            onClick={() => event()}
        >
            {children}
        </button>
    )
}
