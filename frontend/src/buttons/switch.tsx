import { GameMode, MatchType, TimeControl } from "../types/enums/enums";


export type Option = { label: string; value: string };

export interface SwitchProps {
    value: TimeControl | MatchType | GameMode | "ALL";
    onChange: (value: TimeControl | MatchType | GameMode |  "ALL") => void;
    options: { label: string, value: TimeControl | MatchType | GameMode | "ALL" }[];
};


export const Switch = ({ value, onChange, options }: SwitchProps) => {
    return (
        <div
            className="w-full inline-flex flex-wrap items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1"
            role="radiogroup"
            aria-label="Filter"
        >
            {options.map((opt) => {
                const active = value === opt.value;
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
                );
            })}
        </div>
    );
};
