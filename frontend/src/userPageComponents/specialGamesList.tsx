import { Link } from "react-router-dom";
import { FaMedal, FaTrophy } from "react-icons/fa";
import { SpecialGame } from "../types/specialGame";
import { Pagination } from "../components/pagination";
import { useState } from "react";


interface SpecialGamesListProps {
    specialGames: SpecialGame[],
}


export const SpecialGamesList = ({ specialGames }: SpecialGamesListProps) => {
    const [page, setPage] = useState(0);

    return (
        <div>
            <div
                className="text-3xl text-primary font-semibold text-center">
                Special Games
            </div>
            <div
                className="mt-3">
                {
                    specialGames.slice(page * 10, page * 10 + 10).map((specialGame, key) => (
                        <SpecialGameItem specialGame={specialGame} key={key} />
                    ))
                }
                <div
                    className="mt-2">
                    <Pagination page={page} setPage={setPage} maxPages={Math.ceil(specialGames.length / 10 - 1)} />
                </div>
            </div>
        </div>
    )
}

interface SpecialGameItemProps {
    specialGame: SpecialGame,
}


const SpecialGameItem = ({ specialGame }: SpecialGameItemProps) => {
    const order = specialGame.playerResultIndex;
    const medalColor = order === 0 ? "text-[#FFD700]" : order === 1 ? "text-[#c0c0c0]" : order === 2 ? "text-[#CD7F32]" : "hidden";
    const date = specialGame.startedAt ? new Date(specialGame.startedAt) : null;

    return (
        <div
            className="flex items-center justify-between w-full max-w-7xl mx-auto border shadow-sm bg-white px-6">
            <div
                className="w-24 text-primary">
                <FaTrophy className="w-5 h-5" title="Rated game" />
            </div>

            <Link to={"/special/" + specialGame.id}>
                <div
                    className="w-56 text-md font-semibold text-white text-center bg-primary py-3 px-4">
                    {specialGame.name}
                </div>
            </ Link>

            <div
                className="w-20 text-md font-semibold text-primary py-3 pl-3 flex">
                <div>
                    {date?.getDate()}.
                </div>
                <div>
                    {(date?.getMonth() ?? 0) + 1}.
                </div>
                <div>
                    {date?.getFullYear()}
                </div>
            </div>

            <Link to={"/users/" + (specialGame.winner ? specialGame.winner.id : "")} >
                <div
                    className="w-56 ml-5 flex items-center justify-center gap-2 text-md font-semibold text-white bg-secondary py-3 px-4">
                    <FaTrophy className="w-5 h-5" title="trophy" />
                    <span>{specialGame.winner?.nickname}</span>
                </div>
            </Link>

            <div
                className="w-20 flex items-center justify-end text-sm font-medium">
                <FaMedal className={`${medalColor} w-6 h-6`} />
                {(order ?? -1) > 3 && <div>{order}</div>}
            </div>
        </div>
    );
}
