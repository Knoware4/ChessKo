
import { FaTrophy, FaHandshake, FaChessBoard, FaPuzzlePiece } from "react-icons/fa";
import { GameMode, GameResult, MatchType, TimeControl } from "../../types/enums/enums";
import { Link } from "react-router-dom";


export type Player = {
	name: string;
	rating: number;
};

export interface GameRowProps {
	whitePlayer: Player,
	blackPlayer: Player,
	gameResult: GameResult | null,
	matchType: MatchType,
	gameMode: GameMode,
	timeControl: TimeControl,
	gameId: string,
};


export const GameRow = ({ whitePlayer, blackPlayer, gameResult, matchType, gameMode, timeControl, gameId }: GameRowProps) => {
	return (
		<Link to={"/games/" + gameId}>
			<div 
                className="flex items-center justify-between w-full max-w-7xl mx-auto border shadow-sm bg-white px-6">
				<div
                    className="w-20 flex space-x-2 items-center justify-center gap-2 text-primary">
					{matchType === "RATED" || matchType === "TOURNAMENT" ? (
						<FaTrophy className="w-5 h-5" title="Rated game" />
					) : (
						<FaHandshake className="w-5 h-5" title="Friendly game" />
					)}
					{gameMode === "CLASSIC" ? (
						<FaChessBoard className="w-5 h-5" title="Classic chess" />
					) : (
						<FaPuzzlePiece className="w-5 h-5" title="Variant chess" />
					)}
				</div>

				<div
                    className="w-24 text-sm font-semibold text-primary text-center">
					{timeControl}
				</div>

				<div
                    className="flex flex-1 items-center justify-center gap-10">
					<div
                        className="flex flex-col items-center px-3 py-1 bg-gray-100 text-gray-800 w-48">
						<span className="font-medium truncate">♙ {whitePlayer.name}</span>
						<span className="text-xs">{whitePlayer.rating}</span>
					</div>

					<span className="text-lg font-semibold">vs</span>

					<div
                        className="flex flex-col items-center px-3 py-1 bg-primary text-white w-48">
						<span className="font-medium truncate">♟ {blackPlayer.name}</span>
						<span className="text-xs">{blackPlayer.rating}</span>
					</div>
				</div>

				<div
                    className="w-16 text-center text-sm font-medium">
					{gameResult === "DRAW" ? "1/2" : gameResult === "WHITE" ? "1–0" : gameResult === "BLACK" ? "0–1" : ""}
				</div>
			</div>
		</Link>
	);
};
