import { Color, Direction } from "~/lib/types";
import { Piece } from "./piece";
import { Position } from "../position";
import { BLACK_BISHOP, WHITE_BISHOP } from "~/lib/paths";
import { BoardState } from "../board-state";
import { slideMoves } from "../movement-utils";

const BISHOP_DIRECTIONS: Array<Direction> = [
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
] as const;

export class Bishop extends Piece {
    constructor(color: Color, position: Position) {
        super(
            color,
            position,
            "Bishop",
            "B",
            color === "white" ? WHITE_BISHOP : BLACK_BISHOP,
            3,
        );
    };

    getPseudoLegalMoves(board: BoardState): Array<Position> {
        return slideMoves(this.position, this.color, BISHOP_DIRECTIONS, board);
    };
};