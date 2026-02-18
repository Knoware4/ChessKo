import { VariantKey } from "../types/enums/enums";


interface VariantSwitchButtonProps {
    opt: {
        label: string;
        value: VariantKey;
    },
    active: boolean,
    onChange: (value: VariantKey | "ALL") => void,
}


export const VariantSwitchButton = ({ opt, active, onChange }: VariantSwitchButtonProps) => {
    return (
        <button
            className={`flex-1 group inline-flex justify-center items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${active
                ? "bg-primary text-white shadow"
                : "text-gray-700 hover:bg-white"
                }`}
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
        >
            <span 
                className="select-none">{opt.label}</span>
        </button>
    )
}
