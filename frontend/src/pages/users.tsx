import { RankingHeader } from "../buttons/rankingHeader";
import { Loading } from "../components/loading";
import { Error } from "../components/error"
import { usePlayers } from "../hooks/usePlayer";
import { Pagination } from "../components/pagination";
import { useState } from "react";
import { RankingRow } from "../userPageComponents/rankingRow";


export const Users = () => {
    const { data: players, isLoading, error, isRefetching } = usePlayers();

    const [page, setPage] = useState(0);
    const [orderBy, setOrderBy] = useState(0);
    const [search, setSearch] = useState("");

    const orderedPlayers = players?.filter((player) => player.nickname.toLowerCase().includes(search)).sort((p1, p2) => {
        if (orderBy === 0) {
            return p1.nickname.localeCompare(p2.nickname);
        }

        if (orderBy === 1) {
            return p2.eloRankedClassic - p1.eloRankedClassic;
        }

        if (orderBy === 2) {
            return p2.eloRankedRapid - p1.eloRankedRapid;
        }

        if (orderBy === 3) {
            return p2.eloRankedBlitz - p1.eloRankedBlitz;
        }

        if (orderBy === 4) {
            return p2.eloRankedBullet - p1.eloRankedBullet;
        }

        if (orderBy === 5) {
            return p2.eloSpecialClassic - p1.eloSpecialClassic;
        }

        if (orderBy === 6) {
            return p2.eloSpecialRapid - p1.eloSpecialRapid;
        }

        if (orderBy === 7) {
            return p2.eloSpecialBlitz - p1.eloSpecialBlitz;
        }

        if (orderBy === 8) {
            return p2.eloSpecialBullet - p1.eloSpecialBullet;
        }

        return 0;
    });


    if (!players || isLoading || isRefetching) return <Loading />
    if (error) return <Error />

    return (
        <div
            className="flex flex-col items-center justify-center mt-6 mb-3">
            <div
                className="text-3xl text-primary font-semibold text-center">
                Players
            </div>
            <div>
                <div
                    className="">
                    <input
                        className="mt-5 min-w-0 shrink px-3 py-2 rounded-md outline-none text-black border-2 border-primary"
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Player name"
                    />
                </div>
                <div
                    className="">
                    <RankingHeader setOrderByFunction={setOrderBy} />
                </div>
                <div>
                    {
                        orderedPlayers?.map((player, key) => (
                            <RankingRow player={player} key={key} />
                        ))
                    }
                    <div
                        className="w-full mt-2">
                        <Pagination page={page} setPage={setPage} maxPages={Math.ceil(players.length / 10 - 1)} />
                    </div>
                </div>
            </div>
        </div>
    )
}
