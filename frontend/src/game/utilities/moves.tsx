interface MovesProps {
    pgn: string;
}


export const Moves = ({ pgn }: MovesProps) => {
    const moveList = pgn.slice(pgn.indexOf("1")).split(" ").filter(a => !a.includes(".")).slice(0, -1);

    return (
        <div
            className="grid grid-cols-5 border border-black">
            {moveList.map((move, index) => (
                <MoveItem move={move} index={index} key={index} />
            ))}
        </div>
    );
};

interface MoveItemProps {
    move: string;
    index: number;
}


const MoveItem = ({ move, index }: MoveItemProps) => {
    return (
        <div
            className={`${index % 2 === 0 ? "bg-primary text-white col-span-3" : "bg-secondary text-white col-span-2"} flex`}>
            {index % 2 === 0 && <div className="text-center min-w-[3ch] bg-white text-primary col-span-1 py-2 px-2">{index / 2 + 1}.</div>}
            <div className={`"min-w-[6ch] text-center col-span-2 px-5 py-2`}>{move}</div>
        </div>
    );
};
