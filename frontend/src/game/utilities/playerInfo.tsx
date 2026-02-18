interface PlayerInfoProps {
    name: string,
    elo: number | undefined,
    onTop: boolean,
}


export const PlayerInfo = ({ elo, name, onTop }: PlayerInfoProps) => {
    return (
        <div
            className={`flex items-center gap-2 bg-primary p-2 ${onTop ? "rounded-tl-lg" : "rounded-bl-lg"}`}>
            <span
                className="font-mono text-ternary">
                {name}
            </span>
            <span
                className="font-mono text-sm px-2 py-0.5 rounded-full bg-ternary text-primary shadow">
                {elo}
            </span>
        </div>
    )
}
