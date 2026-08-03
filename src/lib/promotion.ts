import { Bishop } from "./pieces/bishop";
import { Knight } from "./pieces/knight";
import { Piece } from "./pieces/piece";
import { Queen } from "./pieces/queen";
import { Rook } from "./pieces/rook";
import { Position } from "./position";
import { Color, PromotionPieceType } from "./types";

export const PROMOTION_PIECE_TYPES: ReadonlyArray<PromotionPieceType> = ["Q", "R", "B", "N"];

export const createPromotionPiece = (type: PromotionPieceType, color: Color, position: Position): Piece => {
    switch (type) {
        case "Q": return new Queen(color, position);
        case "R": return new Rook(color, position);
        case "B": return new Bishop(color, position);
        case "N": return new Knight(color, position);
    }
};

export const isPromotionMove = (piece: Piece, to: Position): boolean => {
    if (piece.notation !== "P") return false;
    return to.rank === (piece.color === "white" ? 8 : 1);
};
