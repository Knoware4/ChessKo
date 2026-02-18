import React from "react";
import { Promotion } from "../../types/enums/enums";


interface PromotionBannerProps {
    promotion: Promotion,
    setPromotion: React.Dispatch<React.SetStateAction<Promotion>>,
}


export const PromotionBanner = ({ promotion, setPromotion }: PromotionBannerProps) => {
    const options: { label: string, value: Promotion }[] = [
        {
            label: "Queen",
            value: "q"
        },
        {
            label: "Rook",
            value: "r"
        },
        {
            label: "Knight",
            value: "n"
        },
        {
            label: "Bishop",
            value: "b"
        },
    ]

    return (
        <div
            className="w-full inline-flex flex-wrap items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1"
            role="radiogroup"
            aria-label="Filter"
        >
            <div
                className="mr-3 ml-2">
                Promotion:
            </div>
            {options.map((opt) => {
                const isActive = promotion === opt.value;
                return (
                    <button
                        className={`flex-1 group inline-flex justify-center items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${isActive
                            ? "bg-primary text-white shadow"
                            : "text-gray-700 hover:bg-white"
                            }`}
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setPromotion(opt.value)}
                    >
                        <span className="select-none">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    )
}
