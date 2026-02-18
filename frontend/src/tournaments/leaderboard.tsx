import { GameMode, TimeControl } from "../types/enums/enums";
import { LeaderboardItem } from "../types/leaderboardItem";


interface LeaderboardProps {
    leaderboardItems: LeaderboardItem[],
    timeControl: TimeControl,
    gameMode: GameMode,
}

export const Leaderboard = ({ leaderboardItems, timeControl, gameMode }: LeaderboardProps) => {
    return (
        <div
            className="w-full">
            <div
                className="max-w-4xl mx-auto">
                <div
                    className="flex flex-col items-stretch">
                    <LeaderboardHeader />
                    {
                        leaderboardItems.map((item, key) => (
                            <LeaderboardRow leaderboardItem={item} timeControl={timeControl} gameMode={gameMode} key={key} />
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

const LeaderboardHeader = () => {
    return (
        <div
            className="flex justify-center mt-6">
            <div
                className={`bg-primary text-white grid grid-cols-4 text-sm font-semibold rounded-t-lg overflow-hidden shadow-md w-full max-w-5xl`}>
                <LeaderboardHeaderItem name="Player name" gridColumn="col-span-2" />
                <LeaderboardHeaderItem name="Score" gridColumn="col-span-1" />
                <LeaderboardHeaderItem name="Rating" gridColumn="col-span-1" />
            </div>
        </div>
    )
}

interface LeaderboardHeaderItemProps {
    name: string,
    gridColumn: string,
}

const LeaderboardHeaderItem = ({ name, gridColumn }: LeaderboardHeaderItemProps) => {
    return (
        <div className={`text-center flex items-center justify-center px-3 py-2 border-r border-white/20 ${gridColumn}`}>{name}</div>
    )
}

interface LeaderboardRowProps {
    leaderboardItem: LeaderboardItem,
    timeControl: TimeControl,
    gameMode: GameMode
}

export const LeaderboardRow = ({ leaderboardItem, timeControl, gameMode }: LeaderboardRowProps) => {
    function getElo() {
        if (gameMode === "CLASSIC" || gameMode === undefined) {
            if (timeControl === "BLITZ") {
                return leaderboardItem.player.eloRankedBlitz;
            }
            else if (timeControl === "RAPID") {
                return leaderboardItem.player.eloRankedRapid;
            }
            else if (timeControl === "BULLET") {
                return leaderboardItem.player.eloRankedBullet;
            }
            else if (timeControl === "CLASSIC") {
                return leaderboardItem.player.eloRankedClassic;
            }
        }
        if (gameMode === "SPECIAL") {
            if (timeControl === "BLITZ") {
                return leaderboardItem.player.eloSpecialBlitz;
            }
            else if (timeControl === "RAPID") {
                return leaderboardItem.player.eloSpecialRapid;
            }
            else if (timeControl === "BULLET") {
                return leaderboardItem.player.eloSpecialBullet;
            }
            else if (timeControl === "CLASSIC") {
                return leaderboardItem.player.eloSpecialClassic;
            }
        }
        return 0;
    }

    return (
        <div
            className="bg-white grid grid-cols-4 border border-ternary">
            <LeaderboardRowItem text={leaderboardItem.player.nickname} gridColumn="col-span-2" />
            <LeaderboardRowItem text={leaderboardItem.score.toString()} gridColumn="col-span-1" />
            <LeaderboardRowItem text={getElo().toString()} gridColumn="col-span-1" />
        </div>
    )
}

interface LeaderboardRowItemProps {
    text?: string,
    gridColumn: string,
}

const LeaderboardRowItem = ({ text, gridColumn }: LeaderboardRowItemProps) => {
    return (
        <div className={`flex items-center justify-center px-3 py-2 border-r border-gray-200 ${gridColumn}`}>{text}</div>
    )
}
