import { Color, Direction, File, Rank } from "~/lib/types";
import { Piece } from "./piece";
import { Position } from "../position";
import { BLACK_KING, WHITE_KING } from "~/lib/paths";
import { BoardState } from "../board-state";

const KING_OFFSETS: Array<Direction> = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
] as const;

export class King extends Piece {
    constructor(color: Color, position: Position) {
        super(
            color,
            position,
            "King",
            "K",
            color === "white" ? WHITE_KING : BLACK_KING,
            100,
        );
    };

    getPseudoLegalMoves(board: BoardState): Array<Position> {
        return [...this.getStepMoves(board), ...this.getCastlingMoves(board)];
    };

    getAttackedSquares(board: BoardState): Array<Position> {
        return this.getStepMoves(board);
    };

    private getStepMoves(board: BoardState): Array<Position> {
        const moves: Array<Position> = [];

        for (const [df, dr] of KING_OFFSETS) {
            const target = this.position.offset(df, dr);
            if (target && this.canMoveTo(board, target)) {
                moves.push(target);
            }
        }

        return moves;
    };

    private getCastlingMoves(board: BoardState): Array<Position> {
        if (this.hasMoved) return [];

        const rank: Rank = this.color === "white" ? 1 : 8;
        const moves: Array<Position> = [];

        if (this.canCastleWithRook(board, rank, "h", ["f", "g"])) {
            moves.push(new Position("g", rank));
        }

        if (this.canCastleWithRook(board, rank, "a", ["b", "c", "d"])) {
            moves.push(new Position("c", rank));
        }

        return moves;
    };

    private canCastleWithRook(
        board: BoardState,
        rank: Rank,
        rookFile: File,
        betweenFiles: ReadonlyArray<File>,
    ): boolean {
        const rook: Piece | undefined = board.getPieceAt(new Position(rookFile, rank));
        if (!rook || rook.notation !== "R" || rook.color !== this.color || rook.hasMoved) {
            return false;
        }

        return betweenFiles.every((file) => !board.isOccupied(new Position(file, rank)));
    };
};