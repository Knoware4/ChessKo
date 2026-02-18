import { useFormContext } from "react-hook-form";
import { CheckBox } from "../inputs/CheckBox";
import { SpecialChessForm } from "../types/forms/specialChessForm";


export const UpgradesSetter = () => {
    const { register } = useFormContext<SpecialChessForm>();

    return (
        <div className="flex flex-col space-y-0">
            <CheckBox text="Extra Turn" register={register} valueName="extraTurn" />
            <CheckBox text="Jump Over" register={register} valueName="jumpOver" />
            <CheckBox text="Pawn Dash" register={register} valueName="pawnDash" />
            <CheckBox text="Time Check" register={register} valueName="timeCheck" />
        </div>
    )
}
