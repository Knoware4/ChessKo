import { Ratings } from "../components/stats/basicStats/ratings";
import { Player } from "../types/player";


interface ProfileHeaderProps {
    player: Player,
}


export const ProfileHeader = ({ player }: ProfileHeaderProps) => {
    return (
        <div>
            <div
                className="text-3xl text-primary font-semibold text-center">
                {player.nickname}
            </div>
            <div
                className="flex space-x-5 text-xl text-primary font-semibold mt-5">
                <Ratings gameMode="Classic" classic={player.eloRankedClassic} rapid={player.eloRankedRapid} blitz={player.eloRankedBlitz} bullet={player.eloRankedBullet} />
                <Ratings gameMode="Chessko" classic={player.eloSpecialClassic} rapid={player.eloSpecialRapid} blitz={player.eloSpecialBlitz} bullet={player.eloSpecialBullet} />
            </div>
        </div>
    )
}
