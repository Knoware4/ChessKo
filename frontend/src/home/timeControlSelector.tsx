import { TimeControlButton } from "../buttons/timeControlButton";
import { FaChessPawn, FaChessKnight, FaChessQueen, FaChessRook } from "react-icons/fa";


interface TimeControlSelectorProps {
    options: {
        minutes: number,
        bonus: number,
    }[],
    timeControl: string,
}


export const TimeControlSelector = ({ options, timeControl }: TimeControlSelectorProps) => {
    return (
        <div>
            <div
                className="inline-flex items-center text-xl text-primary font-semibold text-center">
                {timeControl}
                {timeControl === "Bullet" && <FaChessPawn className="w-5 h-5 ml-1" />}
                {timeControl === "Blitz" && <FaChessKnight className="w-5 h-5 ml-1" />}
                {timeControl === "Rapid" && <FaChessRook className="w-5 h-5 ml-1" />}
                {timeControl === "Classic" && <FaChessQueen className="w-5 h-5 ml-1" />}
            </div>
            <div
                className="flex gap-3 mt-2">
                {options.map((option, key) => (
                    <TimeControlButton option={option} key={key} />
                ))}
            </div>
        </div>
    );
};
