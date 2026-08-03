import { Piece } from "./pieces/piece";
import { Position } from "./position";
import { PromotionPieceType } from "./types";

export const toAlgebraicNotation = (
    piece: Piece,
    from: Position,
    to: Position,
    captured: Piece | null,
    promotion?: PromotionPieceType,
): string => {
    if (piece.notation === "K") {
        const fileDelta: number = to.file.charCodeAt(0) - from.file.charCodeAt(0);
        if (Math.abs(fileDelta) === 2) {
            return fileDelta > 0 ? "O-O" : "O-O-O";
        }
    }

    const isCapture: boolean = captured !== null;
    const promotionSuffix: string = promotion ? `=${promotion}` : "";

    if (piece.notation === "P") {
        return (isCapture ? `${from.file}x${to.toAlgebraic()}` : to.toAlgebraic()) + promotionSuffix;
    }

    return `${piece.notation}${isCapture ? "x" : ""}${to.toAlgebraic()}`;
};
