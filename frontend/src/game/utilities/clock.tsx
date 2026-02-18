interface ClockProps {
    ms: number,
    active: boolean,
    onTop: boolean,
}


export const Clock = ({ ms, active, onTop }: ClockProps) => {
    const fmt = (ms: number) => {
        const total = Math.max(0, Math.floor(ms / 1000));
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div
            className={`p-2 ${onTop ? "rounded-tr-lg" : "rounded-br-lg"} ${active ? "bg-secondary" : "bg-primary"}`}>
            <span
                className={`text-lg ${ms <= 10000 ? "text-red-400" : "text-neutral-100"}`}>
                {fmt(ms)}
            </span>
        </div>
    )
}
