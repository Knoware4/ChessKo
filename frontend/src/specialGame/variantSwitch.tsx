import { VariantSwitchButton } from "../buttons/variantSwitchButton";
import { VariantKey } from "../types/enums/enums";


export type Option = { label: string; value: string };

export interface SwitchProps {
    value: VariantKey;
    onChange: (value: VariantKey |  "ALL") => void;
    options: { label: string, value: VariantKey }[];
};

export const VariantSwitch = ({ value, onChange, options }: SwitchProps) => {
    return (
        <div
            className="w-full inline-flex flex-wrap items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1"
            role="radiogroup"
            aria-label="Filter"
        >
            {options.map((opt, key) => {
                const active = value === opt.value;
                return (
                    <VariantSwitchButton active={active} onChange={onChange} opt={opt} key={key} />
                );
            })}
        </div>
    );
};
