import { Link } from "react-router-dom";
import { Player } from "../types/player";


interface RankingRowProps {
    player: Player
}


export const RankingRow = ({ player }: RankingRowProps) => {
    return (
        <Link to={"/users/" + player.id} className="flex justify-center">
            <div
                className="bg-white hover:bg-ternary text-gray-800 grid grid-cols-10 text-sm font-medium w-full max-w-5xl overflow-hidden shadow">
                <RankingRowItem className="col-span-2 justify-start pl-4 font-semibold text-primary">
                    {player.nickname}
                </RankingRowItem>
                <RankingRowItem>{player.eloRankedClassic}</RankingRowItem>
                <RankingRowItem>{player.eloRankedRapid}</RankingRowItem>
                <RankingRowItem>{player.eloRankedBlitz}</RankingRowItem>
                <RankingRowItem>{player.eloRankedBullet}</RankingRowItem>
                <RankingRowItem>{player.eloSpecialClassic}</RankingRowItem>
                <RankingRowItem>{player.eloSpecialRapid}</RankingRowItem>
                <RankingRowItem>{player.eloSpecialBlitz}</RankingRowItem>
                <RankingRowItem>{player.eloSpecialBullet}</RankingRowItem>
            </div>
        </Link>
    )
}

interface RankingRowItemProps {
    children: React.ReactNode,
    className?: string,
}


export const RankingRowItem = ({ children, className }: RankingRowItemProps) => {
    return (
        <div
            className={`flex items-center justify-center px-3 py-2 border-r border-gray-200 ${className ?? ""}`}>
            {children}
        </div>
    )
}
