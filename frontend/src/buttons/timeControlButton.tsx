import { useFormContext } from "react-hook-form";
import { CreateGameFormType } from "../types/forms/createGameForm";


interface TimeControlButtonProps {
    option: {
        minutes: number,
        bonus: number,
    } | null,
}


export const TimeControlButton = ({ option }: TimeControlButtonProps) => {
    const { setValue, watch } = useFormContext<CreateGameFormType>()

    return (
        <button
            className={`w-16 h-16 flex items-center justify-center rounded-md border text-lg font-semibold transition-colors
            ${watch("timeControl")?.bonus === option?.bonus && watch("timeControl")?.minutes === option?.minutes
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-800 border-gray-400 hover:bg-gray-100"
                }`}
            key={option?.minutes + "+" + option?.bonus}
            type="button"
            onClick={() => setValue("timeControl", option)}
        >
            {option?.minutes + "+" + option?.bonus}
        </button>
    )
}
