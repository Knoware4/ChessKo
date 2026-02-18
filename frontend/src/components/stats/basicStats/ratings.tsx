import { ReactNode } from "react";
import { FaChessPawn, FaChessQueen, FaChessRook, FaChessKnight } from "react-icons/fa";


interface RatingsProps {
    gameMode: string,
    classic: number,
    rapid: number,
    blitz: number,
    bullet: number,
}


export const Ratings = ({ gameMode, blitz, bullet, classic, rapid }: RatingsProps) => {
    return (
        <div>
            <div 
                className="flex flex-col w-64 border-4 border-primary rounded-xl p-2">
                <div 
                    className="text-center">
                    {gameMode}
                </div>
                <RatingItem icon={<FaChessPawn className="w-5 h-5" />} text="Bullet" rating={bullet} />
                <RatingItem icon={<FaChessKnight className="w-5 h-5" />} text="Blitz" rating={blitz} />
                <RatingItem icon={<FaChessRook className="w-5 h-5" />} text="Rapid" rating={rapid} />
                <RatingItem icon={<FaChessQueen className="w-5 h-5" />} text="Classic" rating={classic} />
            </div>
        </div>
    )
}

interface RatingItemProps {
    icon: ReactNode;
    text: string;
    rating: number;
}


const RatingItem = ({ icon, text, rating }: RatingItemProps) => {
    return (
        <div 
            className="flex justify-between items-center text-xl text-primary font-semibold py-1">
            <div 
                className="flex items-center gap-2">
                {icon}
                <span>{text}</span>
            </div>
            <span>{rating}</span>
        </div>
    )
}
