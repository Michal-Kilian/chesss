export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Color = "white" | "black";

export type AlgebraicPosition = `${File}${Rank}`;

export type Value = 1 | 3 | 5 | 9 | 100;

export type PromotionPieceType = "Q" | "R" | "B" | "N";

export type DrawReason = "fifty-move" | "threefold-repetition" | "insufficient-material" | "agreement";

export type GameStatus =
    | { status: "playing" }
    | { status: "checkmate"; winner: Color }
    | { status: "resignation"; winner: Color }
    | { status: "timeout"; winner: Color }
    | { status: "stalemate" }
    | { status: "draw"; reason: DrawReason };

export type Coordinates = {
    x: number;
    y: number;
};

export type Direction = readonly [fileDelta: number, rankDelta: number];