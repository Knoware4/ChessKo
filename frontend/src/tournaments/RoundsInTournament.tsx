import React from "react";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { Game } from "../types/game";
import { Tournament } from "../types/tournament";
import { GameResult } from "../types/enums/enums";
import { SmallArrowButton } from "../buttons/smallArrowButton";


interface RoundsInTournamentProps {
    games: Game[],
    tournament: Tournament,
    round: number,
    setRound: React.Dispatch<React.SetStateAction<number>>,
}


export const RoundsInTournament = ({ games, tournament, round, setRound }: RoundsInTournamentProps) => {
    function whiteRes(res: GameResult | null) {
        if (!res) {
            return "-";
        }
        return res === "DRAW" ? "1/2" : res === "WHITE" ? 1 : 0;
    }

    function blackResult(res: GameResult | null) {
        if (!res) {
            return "-";
        }
        return res === "DRAW" ? "1/2" : res === "BLACK" ? 1 : 0;
    }

    return (
        <div
            className="">
            <div
                className="container mx-auto px-4 flex flex-col">
                <div
                    className="flex flex-col items-center gap-3 rounded-2xl px-5 py-4 ">
                    <div
                        className="text-[11px] font-semibold tracking-[0.25em] text-gray-500">
                        ROUND
                    </div>

                    <div
                        className="text-3xl font-extrabold text-gray-900">
                        {round + 1}
                    </div>

                    <div
                        className="flex items-center gap-3">
                        <SmallArrowButton event={() => setRound((r) => Math.max(0, r - 1))} disabled={round === 0}>
                            <FaArrowAltCircleLeft className="text-2xl text-primary transition group-hover:scale-110" />
                        </SmallArrowButton>
                        <SmallArrowButton event={() => setRound((r) => Math.min(tournament.currentRoundIndex, r + 1))} disabled={round >= tournament.currentRoundIndex}>
                            <FaArrowAltCircleRight className="text-2xl text-primary transition group-hover:scale-110" />
                        </SmallArrowButton>
                    </div>
                </div>


                <div
                    className="flex space-x-5 mt-5">
                    {
                        games.filter(game => game.tournamentRoundIndex === round).map((game, key) => (
                            <div key={key} className="flex flex-col gap-3 bg-white p-4 rounded-2xl shadow-md w-fit">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-primary">⚪ {game.whitePlayer.nickname}</span>
                                    <span className="font-semibold text-gray-700">{whiteRes(game.gameResult)}</span>
                                </div>
                                <div
                                    className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-primary">⚫ {game.blackPlayer.nickname}</span>
                                    <span className="font-semibold text-gray-700">{blackResult(game.gameResult)}</span>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
