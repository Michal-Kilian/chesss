import { Piece } from "./pieces/piece";
import { Position } from "./position";
import { AlgebraicPosition, Color } from "./types";

export interface BoardState {
    getPieceAt(position: Position): Piece | undefined;
    isOccupied(position: Position): boolean;
    isOccupiedByColor(position: Position, color: Color): boolean;
    isOccupiedByOpponent(position: Position, color: Color): boolean;
    enPassantTarget: Position | null;
}

export const createBoardState = (
    piecesByPosition: Map<AlgebraicPosition, Piece>,
    enPassantTarget: Position | null = null,
): BoardState => {
    const getPieceAt = (position: Position): Piece | undefined => piecesByPosition.get(position.toAlgebraic());

    const isOccupied = (position: Position): boolean => getPieceAt(position) !== undefined;

    const isOccupiedByColor = (position: Position, color: Color): boolean => getPieceAt(position)?.color === color;

    const isOccupiedByOpponent = (position: Position, color: Color): boolean => {
        const piece = getPieceAt(position);
        return piece !== undefined && piece.color !== color;
    };

    return {
        getPieceAt,
        isOccupied,
        isOccupiedByColor,
        isOccupiedByOpponent,
        enPassantTarget,
    };
};