import { Piece } from "./pieces/piece";
import { Position } from "./position";
import { BoardState } from "./board-state";
import { AlgebraicPosition, Color } from "./types";

export const isSquareAttacked = (
    piecesByPosition: Map<AlgebraicPosition, Piece>,
    board: BoardState,
    target: Position,
    byColor: Color,
): boolean => {
    const targetKey: AlgebraicPosition = target.toAlgebraic();

    for (const piece of piecesByPosition.values()) {
        if (piece.color !== byColor) continue;

        for (const square of piece.getAttackedSquares(board)) {
            if (square.toAlgebraic() === targetKey) return true;
        }
    }

    return false;
};

export const findKing = (
    piecesByPosition: Map<AlgebraicPosition, Piece>,
    color: Color,
): Piece | undefined => {
    for (const piece of piecesByPosition.values()) {
        if (piece.color === color && piece.notation === "K") return piece;
    }

    return undefined;
};

export const isKingInCheck = (
    piecesByPosition: Map<AlgebraicPosition, Piece>,
    board: BoardState,
    color: Color,
): boolean => {
    const king: Piece | undefined = findKing(piecesByPosition, color);
    if (!king) return false;

    const opponent: Color = color === "white" ? "black" : "white";
    return isSquareAttacked(piecesByPosition, board, king.position, opponent);
};
