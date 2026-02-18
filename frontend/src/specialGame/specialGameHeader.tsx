interface SpecialGameHeaderProps {
    short?: boolean
}


export const SpecialGameHeader = ({ short = false }: SpecialGameHeaderProps) => {
    return (
        <div
            className="flex justify-center mt-6">
            <div
                className={`bg-primary text-white grid ${short ? "grid-cols-9" : "grid-cols-12"} text-sm font-semibold rounded-t-lg overflow-hidden shadow-md w-full max-w-5xl`}>
                <SpecialGameHeaderItem name="Special game name" gridColumn="col-span-2" />
                {!short && <SpecialGameHeaderItem name="Owner name" gridColumn="col-span-2" />}
                {!short && <SpecialGameHeaderItem name="Time" gridColumn="col-span-1" />}
                <SpecialGameHeaderItem name="Variant" gridColumn="col-span-2" />
                <SpecialGameHeaderItem name="Extra Turn" gridColumn="col-span-1" />
                <SpecialGameHeaderItem name="Jump Over" gridColumn="col-span-1" />
                <SpecialGameHeaderItem name="Pawn Dash" gridColumn="col-span-1" />
                <SpecialGameHeaderItem name="Time Check" gridColumn="col-span-1" />
                <SpecialGameHeaderItem name="" gridColumn="col-span-1" />
            </div>
        </div>
    )
}

interface SpecialGameHeaderItemProps {
    name: string,
    gridColumn: string,
}


const SpecialGameHeaderItem = ({ name, gridColumn }: SpecialGameHeaderItemProps) => {
    return (
        <div className={`text-center flex items-center justify-center px-3 py-2 border-r border-white/20 ${gridColumn}`}>{name}</div>
    )
}
