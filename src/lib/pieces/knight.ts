import { Color, Direction } from "~/lib/types";
import { Piece } from "./piece";
import { Position } from "../position";
import { BLACK_KNIGHT, WHITE_KNIGHT } from "~/lib/paths";
import { BoardState } from "../board-state";

const KNIGHT_OFFSETS: Array<Direction> = [
    [1, 2], [2, 1], [2, -1], [1, -2],
    [-1, -2], [-2, -1], [-2, 1], [-1, 2],
] as const;

export class Knight extends Piece {
    constructor(color: Color, position: Position) {
        super(
            color,
            position,
            "Knight",
            "N",
            color === "white" ? WHITE_KNIGHT : BLACK_KNIGHT,
            3
        );
    };

    getPseudoLegalMoves(board: BoardState): Array<Position> {
        const moves: Array<Position> = [];

        for (const [df, dr] of KNIGHT_OFFSETS) {
            const target = this.position.offset(df, dr);
            if (target && this.canMoveTo(board, target)) {
                moves.push(target);
            }
        }

        return moves;
    };
};