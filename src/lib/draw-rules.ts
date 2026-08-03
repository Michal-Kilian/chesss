import { Piece } from "./pieces/piece";
import { Position } from "./position";
import { FILES, RANKS } from "./setup";
import { AlgebraicPosition, Color, Rank } from "./types";

export const FIFTY_MOVE_HALFMOVE_LIMIT: number = 100;

export const THREEFOLD_REPETITION_COUNT: number = 3;

const hasCastlingRight = (
    piecesByPosition: Map<AlgebraicPosition, Piece>,
    color: Color,
    side: "king" | "queen",
): boolean => {
    const rank: Rank = color === "white" ? 1 : 8;

    const king: Piece | undefined = piecesByPosition.get(`e${rank}` as AlgebraicPosition);
    if (!king || king.notation !== "K" || king.color !== color || king.hasMoved) return false;

    const rookFile: "h" | "a" = side === "king" ? "h" : "a";
    const rook: Piece | undefined = piecesByPosition.get(`${rookFile}${rank}` as AlgebraicPosition);
    return rook !== undefined && rook.notation === "R" && rook.color === color && !rook.hasMoved;
};

export const positionKey = (
    piecesByPosition: Map<AlgebraicPosition, Piece>,
    turn: Color,
    enPassantTarget: Position | null,
): string => {
    const placement: Array<string> = [];

    for (const rank of RANKS) {
        for (const file of FILES) {
            const piece: Piece | undefined = piecesByPosition.get(`${file}${rank}` as AlgebraicPosition);
            placement.push(piece ? `${piece.color[0]}${piece.notation}` : "-");
        }
    }

    const castling: string = (["white", "black"] as const)
        .flatMap((color) => (["king", "queen"] as const).map((side) => hasCastlingRight(piecesByPosition, color, side)))
        .map((right) => (right ? "1" : "0"))
        .join("");

    return `${placement.join("")}|${turn}|${castling}|${enPassantTarget ? enPassantTarget.toAlgebraic() : "-"}`;
};

const squareColorParity = (position: Position): number => (FILES.indexOf(position.file) + position.rank) % 2;

export const isInsufficientMaterial = (piecesByPosition: Map<AlgebraicPosition, Piece>): boolean => {
    const pieces: Array<Piece> = [...piecesByPosition.values()].filter((piece) => piece.notation !== "K");

    if (pieces.some((piece) => piece.notation === "P" || piece.notation === "R" || piece.notation === "Q")) {
        return false;
    }

    if (pieces.length === 0 || pieces.length === 1) return true;

    if (pieces.length === 2 && pieces.every((piece) => piece.notation === "B")) {
        const [a, b] = pieces;
        return a.color !== b.color && squareColorParity(a.position) === squareColorParity(b.position);
    }

    return false;
};
