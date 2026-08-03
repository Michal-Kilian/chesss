import { BoardState } from "./board-state";
import { Position } from "./position";
import { Color, Direction } from "./types";

export const slideMoves = (
    from: Position,
    color: Color,
    directions: ReadonlyArray<Direction>,
    board: BoardState,
): Array<Position> => {
    const moves: Array<Position> = [];

    for (const [df, dr] of directions) {
        let next = from.offset(df, dr);

        while (next) {
            if (board.isOccupiedByColor(next, color)) break;

            moves.push(next);

            if (board.isOccupied(next)) break;

            next = next.offset(df, dr);
        }
    }

    return moves;
};