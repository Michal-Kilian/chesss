import { Color, Direction } from "~/lib/types";
import { Piece } from "./piece";
import { Position } from "../position";
import { BLACK_QUEEN, WHITE_QUEEN } from "~/lib/paths";
import { BoardState } from "../board-state";
import { slideMoves } from "../movement-utils";

const QUEEN_DIRECTIONS: Array<Direction> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],

    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
] as const;

export class Queen extends Piece {
    constructor(color: Color, position: Position) {
        super(
            color,
            position,
            "Queen",
            "Q",
            color === "white" ? WHITE_QUEEN : BLACK_QUEEN,
            9,
        );
    };

    getPseudoLegalMoves(board: BoardState): Array<Position> {
        return slideMoves(this.position, this.color, QUEEN_DIRECTIONS, board);
    };
};