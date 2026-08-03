import { Bishop } from "~/lib/pieces/bishop";
import { King } from "~/lib/pieces/king";
import { Knight } from "~/lib/pieces/knight";
import { Pawn } from "~/lib/pieces/pawn";
import { Piece } from "~/lib/pieces/piece";
import { Queen } from "~/lib/pieces/queen";
import { Rook } from "~/lib/pieces/rook";
import { Position } from "~/lib/position";
import { AlgebraicPosition, Color, File, Rank } from "~/lib/types";

export const FILES: Array<File> = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RANKS: Array<Rank> = [1, 2, 3, 4, 5, 6, 7, 8];

const createStartingPosition = (): Array<Piece> => {
    const pieces: Array<Piece> = [];

    const order: Array<
        new (color: Color, position: Position) => Piece
    > = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook];

    FILES.forEach((file: File, i: number) => {
        pieces.push(new Pawn("white", new Position(file, 2)));
        pieces.push(new Pawn("black", new Position(file, 7)));

        pieces.push(new order[i]("white", new Position(file, 1)));
        pieces.push(new order[i]("black", new Position(file, 8)));
    });

    return pieces;
};

export const createStartingPositionMap = (): Map<AlgebraicPosition, Piece> => {
    const pieces: Array<Piece> = createStartingPosition();
    const map: Map<AlgebraicPosition, Piece> = new Map<AlgebraicPosition, Piece>();

    for (const piece of pieces) {
        map.set(piece.position.toAlgebraic(), piece);
    }

    return map;
};