import { Color } from "chess.js";
import { FaChessKing } from "react-icons/fa";


interface SpecialBannerProps {
    extraTurnCounter: number,
    setUseExtraTurn: React.Dispatch<React.SetStateAction<boolean>>,
    activeColor: Color | null,
    myColor: Color | null,
}


export const SpecialBanner = ({ extraTurnCounter, setUseExtraTurn, activeColor, myColor }: SpecialBannerProps) => {
    return (
        <button
            className={`px-6 py-2 inline-flex rounded-md bg-primary text-white font-semibold ${activeColor === myColor && extraTurnCounter === 0 ? "hover:bg-primary/80" : ""} transition-colors`}
            disabled={extraTurnCounter > 0 || (activeColor?.toString() !== myColor?.toString())}
            onClick={() => {
                setUseExtraTurn(prev => !prev);
            }}
            type="submit"
        >
            <div
                className="min-w-[22ch]">
                Use Extra Turn ({extraTurnCounter === 0 ? "READY" : extraTurnCounter})
            </div>
            <FaChessKing className="w-5 h-5 ml-1" />
        </button>
    )
}
