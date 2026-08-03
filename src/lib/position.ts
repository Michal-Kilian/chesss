import { AlgebraicPosition, File, Rank } from "~/lib/types";
import { FILES, RANKS } from "./setup";

export class Position {
    constructor(
        public file: File,
        public rank: Rank,
    ) { }

    toAlgebraic(): AlgebraicPosition {
        return `${this.file}${this.rank}`;
    }

    static fromAlgebraic(algebraic: AlgebraicPosition): Position {
        const file: File = algebraic[0] as File;
        const rank: Rank = Number(algebraic.slice(1)) as Rank;
        return new Position(file, rank);
    }

    offset(fileDelta: number, rankDelta: number): Position | null {
        const fileIndex: number = FILES.indexOf(this.file) + fileDelta;
        const rankIndex: number = RANKS.indexOf(this.rank) + rankDelta;

        if (
            fileIndex < 0 ||
            fileIndex >= FILES.length ||
            rankIndex < 0 ||
            rankIndex >= RANKS.length
        ) return null;

        return new Position(FILES[fileIndex], RANKS[rankIndex]);
    };
}