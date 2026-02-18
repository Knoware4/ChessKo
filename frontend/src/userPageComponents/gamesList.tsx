import { useState } from "react";
import { Switch } from "../buttons/switch";
import { GameRow } from "../components/stats/gameRow";
import { Game } from "../types/game";
import { GameMode, MatchType, TimeControl } from "../types/enums/enums";
import { Pagination } from "../components/pagination";


interface GamesListProps {
    games: Game[],
}


export const GamesList = ({ games }: GamesListProps) => {
    const [timeControl, setTimeControl] = useState<TimeControl | MatchType | GameMode | "ALL">("ALL");
    const [matchType, setMatchType] = useState<TimeControl | MatchType | GameMode | "ALL">("ALL");
    const [gameMode, setGameMode] = useState<TimeControl | MatchType | GameMode | "ALL">("CLASSIC");

    const modes: { label: string, value: TimeControl | "ALL" }[] = [
        { label: "All", value: "ALL" },
        { label: "Bullet", value: "BULLET" },
        { label: "Blitz", value: "BLITZ" },
        { label: "Rapid", value: "RAPID" },
        { label: "Classic", value: "CLASSIC" },
    ]

    const ratingOptions: { label: string, value: MatchType | "ALL" }[] = [
        { label: "All", value: "ALL" },
        { label: "Rated", value: "RATED" },
        { label: "Friendly", value: "FRIENDLY" },
        { label: "Tournament", value: "TOURNAMENT" },
    ]

    const gameModeOptions: { label: string, value: GameMode | "ALL" }[] = [
        { label: "All", value: "ALL" },
        { label: "Classic", value: "CLASSIC" },
        { label: "Chessko", value: "SPECIAL" },
    ]

    const [page, setPage] = useState(0);

    const filteredGames = games.filter((game) => {
        const timeControlMatch = timeControl === "ALL" || game.timeControl === timeControl;
        const matchTypeMatch = matchType === "ALL" || game.matchType === matchType;
        const gameModeMatch = gameMode === "ALL" || game.gameMode === gameMode;
        return timeControlMatch && matchTypeMatch && gameModeMatch;
    });

    return (
        <div>
            <div
                className="text-3xl text-primary font-semibold text-center">
                Games
            </div>
            <div
                className="mt-2 flex flex-col space-y-2 items-center">
                <Switch value={timeControl} onChange={setTimeControl} options={modes} />
                <Switch value={matchType} onChange={setMatchType} options={ratingOptions} />
                <Switch value={gameMode} onChange={setGameMode} options={gameModeOptions} />
            </div>
            <div
                className="mt-5">
                {
                    filteredGames.slice(page * 10, page * 10 + 10).map((game, key) => {
                    
                        return (
                            <GameRow
                                gameId={game.id}
                                key={key}
                                blackPlayer={{ name: game.blackPlayer.nickname, rating:  game.whiteEloBefore }}
                                whitePlayer={{ name: game.whitePlayer.nickname, rating: game.blackEloBefore }}
                                gameResult={game.gameResult}
                                matchType={game.matchType}
                                gameMode={game.gameMode}
                                timeControl={game.timeControl}
                            />
                        )}
                    )
                }
                <div
                    className="mt-2">
                    <Pagination page={page} setPage={setPage} maxPages={Math.ceil(filteredGames.length / 10 - 1)} />
                </div>
            </div>
        </div>
    )
}
