interface SmallButton2Props {
    event: () => void,
    children: React.ReactNode,
}


export const SmallButton2 = ({ event, children }: SmallButton2Props) => {
    return (
        <button 
            className="col-span-1 flex items-center justify-center  hover:bg-ternary"
            onClick={() => event()}>
            {children}
        </button>
    )
}
