import { Chess, Move, Square } from "chess.js";
import { useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Color, Promotion } from "../../types/enums/enums";
import { move } from "../../functions/chessOperations";
import { ValidSpecialMoveWithAfterFen } from "../../sockets/socketPayloads";


type SquareStyles = Record<string, React.CSSProperties>;

interface ChessBoardProps {
    game: Chess,
    myColor: Color,
    fen: string;
    isFinished: boolean,
    gameId: string,
    playerId: string,
    pgn?: string,
    promotion: Promotion,
    moveNumber?: number,
    validSpecialMovesWithAfterFens?: ValidSpecialMoveWithAfterFen[],
    useExtraTurn?: boolean,
    onConsumeExtraTurn?: () => void,
}


export const ChessBoard = ({ game, myColor, fen, isFinished, gameId, playerId, pgn, promotion, moveNumber, validSpecialMovesWithAfterFens, useExtraTurn, onConsumeExtraTurn }: ChessBoardProps) => {
    const chess = useMemo(() => {
        const c = new Chess();
        try {
            if (pgn && moveNumber !== undefined) {
                const tmp = new Chess();
                tmp.loadPgn(pgn);
                const moves = tmp.history({ verbose: true });
                for (let i = 0; i < moveNumber; i++) {
                    c.move(moves[i]);
                }
            }
            else {
                c.load(fen.trim().replace(/\s+/g, " "));
            }
        }
        catch { }
        return c;
    }, [fen, pgn, moveNumber]);

    const my = myColor === "WHITE" ? "w" : "b";
    const isMyTurn = () => game.turn() === my;

    const [optionSquares, setOptionSquares] = useState<SquareStyles>({});
    const [selected, setSelected] = useState<Square | null>(null);
    const clearDots = () => setOptionSquares({});

    const highlightMovesFrom = (square: Square) => {
        if (!isFinished) {
            const moves = game.moves({ square, verbose: true }) as Move[];
            const specialMoves = validSpecialMovesWithAfterFens?.filter((move) => move.from === square);
            if (!moves.length && (!specialMoves || specialMoves.length === 0)) return clearDots();
            const next: SquareStyles = {};
            for (const m of moves) {
                next[m.to as Square] = {
                    background:
                        "radial-gradient(circle, rgba(59,130,246,0.65) 30%, transparent 31%)",
                };
            }
            if (specialMoves) {
                for (const specialMove of specialMoves) {
                    next[specialMove.to as Square] = {
                        background:
                            "radial-gradient(circle, rgba(59,130,246,0.65) 30%, transparent 31%)",
                    };
                }
            }
            setOptionSquares(next);
        }
    };

    const onDrop = (from: Square, to: Square) => {
        if (!isMyTurn || isFinished) return false;
        const piece = chess.get(from);
        if (!piece || piece.color !== my) return false;

        const specialMove = validSpecialMovesWithAfterFens?.find((validMove) => validMove.from === from && validMove.to === to);
        move(from, to, isFinished, gameId, playerId, promotion, specialMove?.special, useExtraTurn);
    
        if (useExtraTurn) {
            onConsumeExtraTurn?.();
        }
        return false;
    };

    const onSquareClick = (sq: Square) => {
        if (!isMyTurn || isFinished) return;

        if (!selected) {
            const piece = chess.get(sq);
            if (!piece || piece.color !== my) return clearDots();
            setSelected(sq);
            highlightMovesFrom(sq);
            return;
        }

        if (selected === sq) {
            setSelected(null);
            clearDots();
            return;
        }

        const specialMove = validSpecialMovesWithAfterFens?.find((validMove) => validMove.from === selected && validMove.to === sq);
        move(selected, sq, isFinished, gameId, playerId, promotion, specialMove?.special, useExtraTurn);
        if (useExtraTurn) {
            onConsumeExtraTurn?.();
        }
        setSelected(null);
        clearDots();
    };

    const isDraggablePiece = ({ piece }: { piece: string }) =>
        piece.startsWith(my) && isMyTurn() && !isFinished;

    return (
        <div
            className="border-4 border-primary">
            <div
                className="overflow-hidden">
                <Chessboard
                    position={isFinished ? chess.fen() : fen}
                    boardOrientation={myColor === "WHITE" ? "white" : "black"}
                    onSquareClick={onSquareClick}
                    onSquareRightClick={() => { setSelected(null); clearDots(); }}
                    onPieceDrop={onDrop}
                    onPieceDragBegin={(_p: string, from: Square) => { setSelected(from); highlightMovesFrom(from); }}
                    onPieceDragEnd={() => { setSelected(null); clearDots(); }}
                    isDraggablePiece={isDraggablePiece}
                    customSquareStyles={optionSquares}
                    arePiecesDraggable
                    showBoardNotation
                    id="main-board"
                    customLightSquareStyle={{ backgroundColor: "#e6e6e6" }}
                    customDarkSquareStyle={{ backgroundColor: "#304c7a" }}
                    showPromotionDialog={false}
                    autoPromoteToQueen={true}
                />
            </div>
        </div>
    )
}
