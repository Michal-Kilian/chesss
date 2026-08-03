import { Color, Direction } from "~/lib/types";
import { Piece } from "./piece";
import { Position } from "../position";
import { BLACK_ROOK, WHITE_ROOK } from "~/lib/paths";
import { slideMoves } from "../movement-utils";
import { BoardState } from "../board-state";

const ROOK_DIRECTIONS: Array<Direction> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
] as const;

export class Rook extends Piece {
    constructor(color: Color, position: Position) {
        super(
            color,
            position,
            "Rook",
            "R",
            color === "white" ? WHITE_ROOK : BLACK_ROOK,
            5,
        );
    };

    getPseudoLegalMoves(board: BoardState): Array<Position> {
        return slideMoves(this.position, this.color, ROOK_DIRECTIONS, board);
    };
};