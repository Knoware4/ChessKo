import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { GameButton } from "../buttons/gameButton";
import { PlayerInfo } from "../game/utilities/playerInfo";
import { Clock } from "../game/utilities/clock";
import { ChessBoard } from "../game/board/chessBoard";
import { Context } from "../App";
import { Link, useParams } from "react-router-dom";
import {
	DrawAcceptedPayload,
	DrawOfferedPayload,
	InvalidMovePayload,
	LoadOngoingGamePayload,
	NoOngoingGamePayload,
	OngoingGameLoadedPayload,
	ResignedPayload,
	TimeoutPayload,
	ValidSpecialMoveWithAfterFen,
	ValidMovePayload,
} from "../sockets/socketPayloads";
import { SocketEvent } from "../sockets/socketEvents";
import { Result } from "../game/utilities/result";
import { OfferPanel } from "../game/utilities/offerPanel";
import { replyOfferDraw, offerDraw, resign } from "../functions/chessOperations";
import { useGame } from "../hooks/useGame";
import { usePlayer } from "../hooks/usePlayer";
import { Color, Promotion } from "../types/enums/enums";
import { PromotionBanner } from "../game/utilities/promotionBanner";
import { ResultWindow } from "../game/utilities/resultWindow";
import { Loading } from "../components/loading";
import { Error } from "../components/error"
import { SpecialBanner } from "../game/utilities/specialBanner";
import { ReplayPanel } from "../game/replay/replayPanel";
import { ExportButton } from "../buttons/exportButton";


export const ClassicGame = () => {
	const { id } = useParams<{ id: string }>();

	if (!id) {
		return <div>Game not found</div>;
	}

	return <ClassicGameInner key={id} gameId={id} />;
};

type ClassicGameInnerProps = {
	gameId: string;
};

const ClassicGameInner = ({ gameId }: ClassicGameInnerProps) => {
	const { player, socket } = useContext(Context);
	const { data: gameData, isLoading: gameDataIsLoading, error: gameDataError, refetch: refetchGame } = useGame(gameId);

	const opponentId = useMemo(() => {
		if (!player || !gameData) return null;

		return gameData.whitePlayer.id === player.id
			? gameData.blackPlayer.id
			: gameData.whitePlayer.id;
	}, [player, gameData]);

	const { data: opponent, isLoading: opponentIsLoading, error: opponentError } = usePlayer(opponentId);

	const [promotion, setPromotion] = useState<Promotion>("q");
	const [offeredDraw, setOfferedDraw] = useState<boolean>(false);
	const [localIsFinished, setLocalIsFinished] = useState<boolean | null>(null);
	const [localMyResult, setLocalMyResult] = useState<0 | 1 | 0.5 | undefined>(undefined);
	const [localOpponentsResult, setLocalOpponentsResult] = useState<0 | 1 | 0.5 | undefined>(undefined);
	const [showResultWindow, setShowResultWindow] = useState(false);
	const [validSpecialMovesWithAfterFens, setValidSpecialMovesWithAfterFens] = useState<ValidSpecialMoveWithAfterFen[]>([]);
	const [useExtraTurn, setUseExtraTurn] = useState(false);
	const [extraTurnCounter, setExtraTurnCounter] = useState(0);
	const [pawnDashesCounter, setPawnDashesCounter] = useState(3);

	const [moveNumber, setMoveNumber] = useState(0);
	const plies = useMemo(() => {
		const tmp = new Chess();
		try {
			tmp.loadPgn(gameData?.pgn ?? "");
			setMoveNumber(tmp.history().length);
			return tmp.history().length
		}
        catch {
			return 0;
		}
	}, [gameData?.pgn]);

	const myColor: Color | null =
		player && gameData ? (player.id === gameData.whitePlayer.id ? "WHITE" : "BLACK") : null;
	const myElo = myColor === "WHITE" ? gameData?.whiteEloBefore : gameData?.blackEloBefore;
	const opponentElo = myColor === "WHITE" ? gameData?.blackEloBefore : gameData?.whiteEloBefore;

	const game = useMemo(() => new Chess(), []);
	const result = gameData?.gameResult;

	const isFinished = !(gameData?.gameResult === null || gameData?.gameResult === undefined);

	function getMyResult(): 0 | 1 | 0.5 | undefined {
		if (!result || !myColor) return undefined;
		if (myColor === "WHITE" && result === "WHITE") return 1;
		if (myColor === "BLACK" && result === "BLACK") return 1;
		if (result === "DRAW") return 0.5;
		return 0;
	}

	function getOpponentsResult(myResult: 0 | 1 | 0.5 | undefined): 0 | 1 | 0.5 | undefined {
		if (myResult === undefined) return undefined;
		if (myResult === 1) return 0;
		if (myResult === 0) return 1;
		return 0.5;
	}

	const myResult = getMyResult();
	const opponentResult = getOpponentsResult(myResult);

	const INITIAL_MS = 10 * 30 * 1000;

	const [myTime, setMyTime] = useState(INITIAL_MS);
	const [opponentTime, setOpponentTime] = useState(INITIAL_MS);
	const [activeColor, setActiveColor] = useState<"w" | "b" | null>(null);
	const [isRunning, setIsRunning] = useState(true);
	const currentGameIdRef = useRef<string>(gameId);
	const validSpecialMovesWithAfterFensRef = useRef<ValidSpecialMoveWithAfterFen[]>([]);

	useEffect(() => {
		currentGameIdRef.current = gameId;
	}, [gameId]);

	useEffect(() => {
		setOfferedDraw(false);
		setLocalIsFinished(null);
		setLocalMyResult(undefined);
		setLocalOpponentsResult(undefined);

		setIsRunning(true);
		setValidSpecialMovesWithAfterFens([]);
		validSpecialMovesWithAfterFensRef.current = [];
		setMyTime(INITIAL_MS);
		setOpponentTime(INITIAL_MS);
		setActiveColor(null);
	}, [gameId]);

	useEffect(() => {
		if (!isRunning || isFinished || localIsFinished) return;
		if (!myColor) return;

		const myColorShort = myColor === "BLACK" ? "b" : "w";
		const intervalId = setInterval(() => {
			if (activeColor === myColorShort) {
				setMyTime((t) => (t <= 0 ? 0 : t - 100));
			}
            else {
				setOpponentTime((t) => (t <= 0 ? 0 : t - 100));
			}
		}, 100);

		return () => clearInterval(intervalId);
	}, [isRunning, activeColor, myColor, isFinished, localIsFinished]);

	useEffect(() => {
		if (myTime <= 0 || opponentTime <= 0) {
			setIsRunning(false);
		}
	}, [myTime, opponentTime]);

	useEffect(() => {
		if (!socket) return;

		function move(payload: ValidMovePayload) {
			if ((payload as any).gameId && (payload as any).gameId !== currentGameIdRef.current) {
				return;
			}

			const specialMove = validSpecialMovesWithAfterFensRef.current.find(
				(validSpecialMove) =>
					validSpecialMove.from === payload.from && validSpecialMove.to === payload.to
			);

			if (specialMove) {
				try {
					game.load(specialMove.afterFen);
				}
                catch (e) {
					console.error("Failed to load special move afterFen", e);
					game.move({ from: payload.from, to: payload.to, promotion: payload.promotion });
				}
			}
            else {
				game.move({ from: payload.from, to: payload.to, promotion: payload.promotion });
			}

			if (payload.extraMoveFen) {
				try {
					game.load(payload.extraMoveFen);
				}
                catch (e) {
					console.error("Failed to load extraMoveFen", e);
				}
			}

			if (payload.winnerId) {
				if (player && payload.winnerId === player.id) {
					setLocalMyResult(1);
					setLocalOpponentsResult(0);
				}
                else {
					setLocalMyResult(0);
					setLocalOpponentsResult(1);
				}
				setLocalIsFinished(true);
				setIsRunning(false);
				setShowResultWindow(true);
			}
            else if (myColor === "WHITE") {
				setMyTime(payload.whiteTime);
				setOpponentTime(payload.blackTime);
				if (payload.turnsBeforeExtra) {
					setExtraTurnCounter(payload.turnsBeforeExtra.w);
				}
				if (payload.remainingPawnDashes) {
					setPawnDashesCounter(payload.remainingPawnDashes.w);
				}
			}
            else {
				setOpponentTime(payload.whiteTime);
				setMyTime(payload.blackTime);
				if (payload.turnsBeforeExtra) {
					setExtraTurnCounter(payload.turnsBeforeExtra.b);
				}
				if (payload.remainingPawnDashes) {
					setPawnDashesCounter(payload.remainingPawnDashes.b);
				}
			}

			const nextValidSpecialMoves = payload.validSpecialMovesWithAfterFens ?? [];
			setValidSpecialMovesWithAfterFens(nextValidSpecialMoves);
			validSpecialMovesWithAfterFensRef.current = nextValidSpecialMoves;

			setActiveColor(game.turn());
			setOfferedDraw(false);
		}

		function invalidMove(payload: InvalidMovePayload) {
			console.log("Invalid move", payload);
		}

		socket.on(SocketEvent.VALID_MOVE, move);
		socket.on(SocketEvent.INVALID_MOVE, invalidMove);

		return () => {
			socket.off(SocketEvent.VALID_MOVE, move);
			socket.off(SocketEvent.INVALID_MOVE, invalidMove);
		};
	}, [socket, game, player, myColor, gameData?.matchType]);

	useEffect(() => {
		if (!socket || !player) return;

		function loadGame(payload: OngoingGameLoadedPayload) {
			if ((payload as any).gameId && (payload as any).gameId !== currentGameIdRef.current) {
				console.log(
					"Ignoring ONGOING_GAME_LOADED for old game",
					(payload as any).gameId,
					"current:",
					currentGameIdRef.current
				);
				return;
			}
			if (!isFinished) {
				console.log("🎮 game loaded:", payload);
				game.load(payload.fen);
				setActiveColor(payload.turnColor);

				if (myColor === "WHITE") {
					setMyTime(payload.whiteTime);
					setOpponentTime(payload.blackTime);
					if (payload.turnsBeforeExtra) {
						setExtraTurnCounter(payload.turnsBeforeExtra.w);
					}
					if (payload.remainingPawnDashes) {
						setPawnDashesCounter(payload.remainingPawnDashes.w);
					}
				}
                else {
					setOpponentTime(payload.whiteTime);
					setMyTime(payload.blackTime);
					if (payload.turnsBeforeExtra) {
						setExtraTurnCounter(payload.turnsBeforeExtra.b);
					}
					if (payload.remainingPawnDashes) {
						setPawnDashesCounter(payload.remainingPawnDashes.b);
					}
				}
				setIsRunning(true);
				setLocalIsFinished(null);
				setLocalMyResult(undefined);
				setLocalOpponentsResult(undefined);
				const nextValidSpecialMoves = payload.validSpecialMovesWithAfterFens ?? [];
				setValidSpecialMovesWithAfterFens(nextValidSpecialMoves);
				validSpecialMovesWithAfterFensRef.current = nextValidSpecialMoves;
			}
            else {
				game.load(gameData.pgn);
			}

		}

		function gameWasNotLoaded(payload: NoOngoingGamePayload) {
			console.log("No ongoing game", payload);
		}

		function offeredDraw(payload: DrawOfferedPayload) {
			if ((payload as any).gameId && (payload as any).gameId !== currentGameIdRef.current) {
				return;
			}
			setOfferedDraw(true);
		}

		function acceptedDraw(payload: DrawAcceptedPayload) {
			if ((payload as any).gameId && (payload as any).gameId !== currentGameIdRef.current) {
				return;
			}
			setLocalMyResult(0.5);
			setLocalOpponentsResult(0.5);
			setLocalIsFinished(true);
			setIsRunning(false);
			setShowResultWindow(true);
			setOfferedDraw(false);
		}

		function declinedDraw() {
			setOfferedDraw(false);
			setOfferedDraw(false);
		}

		function resigned(payload: ResignedPayload) {
			if ((payload as any).gameId && (payload as any).gameId !== currentGameIdRef.current) {
				return;
			}

			if (player && payload.winnerId === player.id) {
				setLocalMyResult(1);
				setLocalOpponentsResult(0);
			}
            else {
				setLocalMyResult(0);
				setLocalOpponentsResult(1);
			}
			setLocalIsFinished(true);
			setIsRunning(false);
			setShowResultWindow(true);
		}

		function timeout(payload: TimeoutPayload) {
			if (payload.winnerId === player?.id) {
				setLocalMyResult(1);
				setLocalOpponentsResult(0);
			}
            else {
				setLocalMyResult(0);
				setLocalOpponentsResult(1);
			}
			setLocalIsFinished(true);
			setIsRunning(false);
			setShowResultWindow(true);
		}

		socket.on(SocketEvent.ONGOING_GAME_LOADED, loadGame);
		socket.on(SocketEvent.NO_ONGOING_GAME, gameWasNotLoaded);
		socket.on(SocketEvent.DRAW_OFFERED, offeredDraw);
		socket.on(SocketEvent.DRAW_ACCEPTED, acceptedDraw);
		socket.on(SocketEvent.DRAW_DECLINED, declinedDraw);

		socket.on(SocketEvent.RESIGNED, resigned);
		socket.on(SocketEvent.TIMEOUT, timeout);

		const payload: LoadOngoingGamePayload = {
			gameId,
			playerId: player.id,
		};
		socket.emit(SocketEvent.LOAD_ONGOING_GAME, payload);

		return () => {
			socket.off(SocketEvent.ONGOING_GAME_LOADED, loadGame);
			socket.off(SocketEvent.NO_ONGOING_GAME, gameWasNotLoaded);
			socket.off(SocketEvent.DRAW_OFFERED, offeredDraw);
			socket.off(SocketEvent.DRAW_ACCEPTED, acceptedDraw);
			socket.off(SocketEvent.DRAW_DECLINED, declinedDraw);
			socket.off(SocketEvent.RESIGNED, resigned);
			socket.off(SocketEvent.TIMEOUT, timeout);
		};
	}, [socket, game, myColor, player, gameId]);

	if (!player || !gameData || gameDataIsLoading) return <Loading />;
	if (!opponent && opponentId) return <Loading />;
	if (!opponent || opponentIsLoading || !myColor) return <Loading />;
	if (gameDataError || opponentError) return <Error />

	return (
		<div
            className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto mt-4 ">
			{
				showResultWindow && localMyResult !== undefined &&
				<ResultWindow result={localMyResult} setShowResultWindow={setShowResultWindow} refetch={refetchGame} />
			}
			<div
                className="flex justify-between bg-ternary rounded-t-lg items-center">
				<div
                    className="flex">
					<PlayerInfo elo={myElo} name={opponent.nickname} onTop={true} />
					<Result
						result={
							opponentResult !== undefined ? opponentResult : localOpponentsResult
						}
					/>
				</div>
				{
					!gameData.finishedAt &&
					<Clock
						ms={opponentTime}
						active={
							((myColor === "WHITE" && activeColor === "b") ||
								(myColor === "BLACK" && activeColor === "w")) &&
							(isFinished === false || localIsFinished === false)
						}
						onTop={true}
					/>
				}
			</div>
			<div
                className="flex flex-col md:flex-row md:items-start gap-4">
				<div
                    className="flex-1">
					<ChessBoard
						moveNumber={moveNumber}
						pgn={gameData.pgn}
						promotion={promotion}
						game={game}
						myColor={myColor}
						fen={game.fen()}
						isFinished={isFinished}
						gameId={gameData.id}
						playerId={player.id}
						validSpecialMovesWithAfterFens={validSpecialMovesWithAfterFens}
						useExtraTurn={useExtraTurn}
						onConsumeExtraTurn={() => setUseExtraTurn(false)}
					/>
				</div>
			</div>

			<div
                className="flex justify-between bg-ternary rounded-b-lg">
				<div
                    className="flex">
					<PlayerInfo name={player.nickname} elo={opponentElo} onTop={false} />
					<Result result={myResult !== undefined ? myResult : localMyResult} />
				</div>
				<div
                    className="flex gap-2">
					{!isFinished && (
						<div className="flex gap-2 items-center">
							{!offeredDraw && <GameButton name="Draw" event={() => offerDraw(gameId, player.id, isFinished)} />}
							<GameButton name="Resign" event={() => resign(gameId, player.id, isFinished)} />
						</div>
					)}
					{
						gameData.finishedAt && gameData.gameMode === "CLASSIC" &&
						<ReplayPanel moveNumber={moveNumber} plies={plies} setMoveNumber={setMoveNumber} />
					}
					{
						!gameData.finishedAt &&
						<Clock
							ms={myTime}
							active={
								isRunning &&
								((myColor === "WHITE" && activeColor === "w") ||
									(myColor === "BLACK" && activeColor === "b")) &&
								(isFinished === false || localIsFinished === false)
							}
							onTop={false}
						/>
					}
				</div>
			</div>

			<div
                className="mt-3 mb-3">
				{offeredDraw && !isFinished && !localIsFinished && (
					<OfferPanel
						text="Opponent offered draw"
						acceptFunction={() =>
							replyOfferDraw(
								true,
								gameId,
								player.id,
								isFinished,
								setOfferedDraw,
							)
						}
						declineFunction={() =>
							replyOfferDraw(
								false,
								gameId,
								player.id,
								isFinished,
								setOfferedDraw,
							)
						}
					/>
				)}
			</div>
			<div>
				{
					!gameData.finishedAt &&
					<PromotionBanner promotion={promotion} setPromotion={setPromotion} />

				}
				{
					!isFinished && gameData.gameMode === "SPECIAL" && gameData.specialConfiguration?.upgradeKeys.includes("EXTRA_TURN") &&
					<div
                        className="mt-4">
						<SpecialBanner extraTurnCounter={extraTurnCounter} setUseExtraTurn={setUseExtraTurn} activeColor={activeColor} myColor={myColor === "WHITE" ? "w" : "b"} />
					</div>
				}
				{
					!isFinished && gameData.gameMode === "SPECIAL" && gameData.specialConfiguration?.upgradeKeys.includes("PAWN_DASH") &&
					<div
                        className="mt-2">
						Pawn Dashes: {pawnDashesCounter}
					</div>
				}
			</div>
			<div
                className="flex space-x-5">
				{
					gameData.finishedAt && gameData.matchType === "TOURNAMENT" &&
					<Link to={`/tournaments/${gameData.tournamentId}`}>
						<button
							className="px-6 py-2 inline-flex rounded-b-md bg-primary text-white font-semibold hover:bg-primary/80 transition-colors">
							<div className="mx-auto">
								Return to the waiting room
							</div>
						</button>
					</Link>
				}
				{
					isFinished && gameData.gameMode === "CLASSIC" &&
					<ExportButton alertText="PGN was copied!" buttonText="Copy PGN" pgn={gameData.pgn} />
				}
			</div>
		</div>
	);
};
