import { Color } from "~/lib/types";
import { Piece } from "./piece";
import { Position } from "../position";
import { BLACK_PAWN, WHITE_PAWN } from "~/lib/paths";
import { BoardState } from "../board-state";

export class Pawn extends Piece {
    constructor(color: Color, position: Position) {
        super(
            color,
            position,
            "Pawn",
            "P",
            color === "white" ? WHITE_PAWN : BLACK_PAWN,
            1
        );
    };

    getPseudoLegalMoves(board: BoardState): Array<Position> {
        const moves: Array<Position> = [];
        const direction: 1 | -1 = this.color === "white" ? 1 : -1;
        const startingRank: 2 | 7 = this.color === "white" ? 2 : 7;

        const oneStep: Position | null = this.position.offset(0, direction);
        if (oneStep && !board.isOccupied(oneStep)) {
            moves.push(oneStep);

            if (this.position.rank === startingRank) {
                const twoStep = this.position.offset(0, direction * 2);
                if (twoStep && !board.isOccupied(twoStep)) {
                    moves.push(twoStep);
                }
            }
        }

        for (const df of [-1, 1]) {
            const target: Position | null = this.position.offset(df, direction);
            if (!target) continue;

            if (board.isOccupiedByOpponent(target, this.color)) {
                moves.push(target);
            } else if (board.enPassantTarget && board.enPassantTarget.toAlgebraic() === target.toAlgebraic()) {
                moves.push(target);
            }
        }

        return moves;
    };

    getAttackedSquares(): Array<Position> {
        const direction: 1 | -1 = this.color === "white" ? 1 : -1;
        const squares: Array<Position> = [];

        for (const df of [-1, 1]) {
            const target = this.position.offset(df, direction);
            if (target) squares.push(target);
        }

        return squares;
    };
};