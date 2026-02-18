import { FaMedal, FaTrophy } from "react-icons/fa";
import { Tournament } from "../types/tournament";
import { Link } from "react-router-dom";


interface Trophy {
    id: string;
    name: String;
    playerResultIndex: number | undefined;
}

interface TrophiesProps {
    tournaments: Tournament[];
}


export const Trophies= ({ tournaments }: TrophiesProps) => {
    const trophies: Trophy[] = tournaments
        .filter(
            (tournament) =>
                tournament.playerResultIndex !== undefined &&
                tournament.playerResultIndex <= 2
        )
        .map((t) => ({ id: t.id, name: t.name, playerResultIndex: t.playerResultIndex }));

    return (
        <div>
            <div
                className="text-3xl text-primary font-semibold text-center">
                Trophies
            </div>
            <div
                className="mt-3 flex flex-wrap justify-center gap-5">
                {trophies.map((trophy) => (
                    <TrophyItem trophy={trophy} key={trophy.id} />
                ))}
            </div>
        </div>
    );
};

interface TrophyItemProps {
    trophy: Trophy;
}


const TrophyItem = ({ trophy }: TrophyItemProps) => {
    return (
        <Link to={"/tournaments/" + trophy.id}>
            <div
                className="
                    w-[220px] shrink-0
                    overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5
                    transition hover:-translate-y-0.5 hover:shadow-md
                "
            >
                <div
                    className="flex items-center justify-center bg-gradient-to-b from-amber-50 to-white px-6 py-8">
                    {
                        trophy.playerResultIndex === 0 &&
                        <FaTrophy
                            className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-[0_14px_22px_rgba(0,0,0,0.18)]"
                            style={{
                                color: "#d4af37",
                                filter:
                                    "drop-shadow(0 0 18px rgba(212,175,55,0.55)) drop-shadow(0 4px 0 rgba(0,0,0,0.15))",
                            }}
                            aria-hidden
                        />
                    }
                    {
                        trophy.playerResultIndex === 1 &&
                        <FaMedal
                            className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-[0_14px_22px_rgba(0,0,0,0.18)]"
                            style={{
                                color: "#c0c0c0",
                                filter:
                                    "drop-shadow(0 0 18px rgba(192,192,192,0.55)) drop-shadow(0 4px 0 rgba(0,0,0,0.15))",
                            }}
                            aria-hidden
                        />
                    }
                    {
                        trophy.playerResultIndex === 2 &&
                        <FaMedal
                            className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-[0_14px_22px_rgba(0,0,0,0.18)]"
                            style={{
                                color: "#CD7F32",
                                filter:
                                    "drop-shadow(0 0 18px rgba(205,127,50,0.55)) drop-shadow(0 4px 0 rgba(0,0,0,0.15))",
                            }}
                            aria-hidden
                        />
                    }
                    <span className="sr-only">Trophy</span>
                </div>

                <div
                    className="border-t border-slate-100 px-4 py-3">
                    <p
                        className="text-center text-sm font-semibold text-slate-900 line-clamp-2">
                        {trophy.name}
                    </p>
                </div>
            </div>
        </Link>
    );
};
