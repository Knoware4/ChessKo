import { FaArrowAltCircleLeft, FaArrowAltCircleRight, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { ArrowButton } from "../../../buttons/arrowButton";


interface ReplayBannerProps {
    setMoveNumber: (value: React.SetStateAction<number>) => void,
    moveNumber: number,
    plies: number,
}


export const ReplayBanner = ({ setMoveNumber, moveNumber, plies }: ReplayBannerProps) => {
    return (
        <div
            className="flex gap-2 items-center">
            <ArrowButton event={() => setMoveNumber(0)}>
                <FaArrowAltCircleLeft />
            </ArrowButton>
            <ArrowButton event={() => setMoveNumber(moveNumber > 0 ? moveNumber - 1 : moveNumber)}>
                <FaArrowLeft />
            </ArrowButton>
            <ArrowButton event={() => setMoveNumber(moveNumber < plies ? moveNumber + 1 : moveNumber)}>
                <FaArrowRight />
            </ArrowButton>
            <ArrowButton event={() => setMoveNumber(plies)}>
                <FaArrowAltCircleRight />
            </ArrowButton>
        </div>
    )
}
