import { Link } from "react-router-dom";
import { Tournament } from "../types/tournament";
import { FaMedal, FaTrophy } from "react-icons/fa";
import { Pagination } from "../components/pagination";
import { useState } from "react";


interface TournamentsListProps {
    tournaments: Tournament[],
}


export const TournamentsList = ({ tournaments }: TournamentsListProps) => {
    const [page, setPage] = useState(0);

    return (
        <div>
            <div
                className="text-3xl text-primary font-semibold text-center">
                Tournaments
            </div>
            <div
                className="mt-3">
                {
                    tournaments.slice(page * 10, page * 10 + 10).map((tournament, key) => (
                        <TournamentItem tournament={tournament} key={key} />
                    ))
                }
                <div
                    className="mt-2">
                    <Pagination page={page} setPage={setPage} maxPages={Math.ceil(tournaments.length / 10 - 1)} />
                </div>
            </div>
        </div>
    )
}

interface TournamentProps {
    tournament: Tournament,
}


const TournamentItem = ({ tournament }: TournamentProps) => {
    const order = tournament.playerResultIndex;
    const medalColor = order === 0 ? "text-[#FFD700]" : order === 1 ? "text-[#c0c0c0]" : order === 2 ? "text-[#CD7F32]" : "hidden";
    const date = tournament.startedAt ? new Date(tournament.startedAt) : null;

    console.log(tournament.playerResultIndex);

    return (
        <div
            className="flex items-center justify-between w-full max-w-7xl mx-auto border shadow-sm bg-white px-6">
            <div
                className="w-24 text-primary">
                <FaTrophy className="w-5 h-5" title="Rated game" />
            </div>

            <Link to={"/tournaments/" + tournament.id}>
                <div
                    className="w-56 text-md font-semibold text-white text-center bg-primary py-3 px-4">
                    {tournament.name}
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

            <Link to={"/users/" + tournament.winner.id} >
                <div
                    className="w-56 ml-5 flex items-center justify-center gap-2 text-md font-semibold text-white bg-secondary py-3 px-4">
                    <FaTrophy className="w-5 h-5" title="trophy" />
                    <span>{tournament.winner.nickname}</span>
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
