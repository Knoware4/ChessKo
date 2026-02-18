import { Check, X } from "lucide-react";
import { SmallButton } from "../../buttons/smallButton";


interface OfferPanelProps {
    text: string,
    acceptFunction: () => void,
    declineFunction: () => void,
}


export const OfferPanel = ({ text, acceptFunction, declineFunction }: OfferPanelProps) => {
    return (
        <div
            className="flex rounded-2xl border bg-primary items-center justify-between p-2">
            <div className="font-bold text-ternary">{text}</div>
            <div>
                <div
                    className="flex gap-3">
                    <SmallButton event={acceptFunction}>
                        <Check color="black" />
                    </SmallButton>
                    <SmallButton event={declineFunction}>
                        <X color="black" />
                    </SmallButton>
                </div>
            </div>
        </div>
    )
}
