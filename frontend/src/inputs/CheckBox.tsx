import { UseFormRegister } from "react-hook-form";
import { SpecialChessForm } from "../types/forms/specialChessForm";


interface CheckBoxProps {
    text: string,
    register: UseFormRegister<SpecialChessForm>,
    disabled?: boolean,
    valueName: "timeCheck" | "extraTurn" | "pawnDash" | "jumpOver",
}


export const CheckBox = ({ text, register, disabled = false, valueName }: CheckBoxProps) => {
    return (
        <div
            className="flex items-center space-x-1">
            <label
                className="inline-flex items-center cursor-pointer select-none rounded-md p-3">
                <input type="checkbox" className="peer sr-only" {...register(valueName)} disabled={disabled} />

                <span
                    className="
            relative flex h-7 w-7 items-center justify-center
            rounded-md border border-gray-300 bg-white transition-colors
            peer-checked:bg-primary peer-checked:border-primary

            after:content-[''] after:absolute
            after:h-4 after:w-2
            after:border-b-[3px] after:border-r-[3px]
            after:border-transparent
            after:rotate-45
            after:opacity-0 after:transition-opacity
            after:-mt-0.5

            peer-checked:after:border-white
            peer-checked:after:opacity-100
          "
                />
            </label>

            <div>{text}</div>
        </div>
    )
}
