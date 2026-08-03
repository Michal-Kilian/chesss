import { createMemo, createSignal, Setter } from "solid-js";
import { Piece } from "./pieces/piece";
import { Position } from "./position";
import { createStartingPositionMap, FILES } from "./setup";
import { AlgebraicPosition, Color, GameStatus, PromotionPieceType, Rank, Value } from "./types";
import { BoardState, createBoardState } from "./board-state";
import { findKing, isKingInCheck, isSquareAttacked } from "./check";
import {
    FIFTY_MOVE_HALFMOVE_LIMIT,
    isInsufficientMaterial,
    positionKey,
    THREEFOLD_REPETITION_COUNT,
} from "./draw-rules";
import { toAlgebraicNotation } from "./notation";
import { createPromotionPiece } from "./promotion";

export interface CaptureInfo {
    piece: Piece;
    square: Position;
}

const relocate = (map: Map<AlgebraicPosition, Piece>, piece: Piece, from: Position, to: Position): void => {
    map.delete(from.toAlgebraic());
    map.set(to.toAlgebraic(), piece);
    piece.position = to;
    piece.hasMoved = true;
};

const getCastlingRookMove = (
    piece: Piece,
    from: Position,
    to: Position,
): { from: Position; to: Position } | null => {
    if (piece.notation !== "K") return null;

    const fileDelta: number = FILES.indexOf(to.file) - FILES.indexOf(from.file);
    if (Math.abs(fileDelta) !== 2) return null;

    return fileDelta > 0
        ? { from: new Position("h", from.rank), to: new Position("f", from.rank) }
        : { from: new Position("a", from.rank), to: new Position("d", from.rank) };
};

const getEnPassantTarget = (piece: Piece, from: Position, to: Position): Position | null => {
    if (piece.notation !== "P" || Math.abs(to.rank - from.rank) !== 2) return null;
    return new Position(from.file, ((from.rank + to.rank) / 2) as Rank);
};

const getEnPassantCaptureSquare = (
    piece: Piece,
    from: Position,
    to: Position,
    capturedAtTo: Piece | undefined,
): Position | null => {
    if (capturedAtTo || piece.notation !== "P" || from.file === to.file) return null;
    return new Position(to.file, from.rank);
};

const clonePiece = (piece: Piece): Piece => Object.assign(Object.create(Object.getPrototypeOf(piece)), piece);

const cloneBoardMap = (map: Map<AlgebraicPosition, Piece>): Map<AlgebraicPosition, Piece> => {
    const next = new Map<AlgebraicPosition, Piece>();
    for (const [key, piece] of map) next.set(key, clonePiece(piece));
    return next;
};

const simulateMove = (
    map: Map<AlgebraicPosition, Piece>,
    from: Position,
    to: Position,
): Map<AlgebraicPosition, Piece> => {
    const simulated: Map<AlgebraicPosition, Piece> = cloneBoardMap(map);
    const piece: Piece | undefined = simulated.get(from.toAlgebraic());
    if (!piece) return simulated;

    const enPassantSquare: Position | null = getEnPassantCaptureSquare(piece, from, to, simulated.get(to.toAlgebraic()));
    if (enPassantSquare) simulated.delete(enPassantSquare.toAlgebraic());

    relocate(simulated, piece, from, to);

    const castlingRook: { from: Position, to: Position } | null = getCastlingRookMove(piece, from, to);
    if (castlingRook) {
        const rook: Piece | undefined = simulated.get(castlingRook.from.toAlgebraic());
        if (rook) relocate(simulated, rook, castlingRook.from, castlingRook.to);
    }

    return simulated;
};

export class GameState {
    private readonly piecesSignal = createSignal<Map<AlgebraicPosition, Piece>>(createStartingPositionMap());
    private readonly setPieces: Setter<Map<AlgebraicPosition, Piece>> = this.piecesSignal[1];

    private readonly turnSignal = createSignal<Color>("white");
    private readonly setTurn: Setter<Color> = this.turnSignal[1];

    private readonly lastMoveSignal = createSignal<{ from: Position; to: Position } | null>(null);
    private readonly setLastMove: Setter<{ from: Position; to: Position } | null> = this.lastMoveSignal[1];

    private readonly enPassantTargetSignal = createSignal<Position | null>(null);
    private readonly setEnPassantTarget: Setter<Position | null> = this.enPassantTargetSignal[1];

    private readonly halfmoveClockSignal = createSignal(0);
    private readonly setHalfmoveClock: Setter<number> = this.halfmoveClockSignal[1];

    private readonly positionCountsSignal = createSignal<Map<string, number>>(
        new Map([[positionKey(createStartingPositionMap(), "white", null), 1]]),
    );
    private readonly setPositionCounts: Setter<Map<string, number>> = this.positionCountsSignal[1];

    private readonly movesSignal = createSignal<Array<string>>([]);
    private readonly setMoves: Setter<Array<string>> = this.movesSignal[1];

    private readonly capturedPiecesSignal = createSignal<Array<Piece>>([]);
    private readonly setCapturedPieces: Setter<Array<Piece>> = this.capturedPiecesSignal[1];

    private readonly materialScoreSignal = createSignal(0);
    private readonly setMaterialScore: Setter<number> = this.materialScoreSignal[1];

    private readonly overrideSignal = createSignal<GameStatus | null>(null);

    get pieces(): Map<AlgebraicPosition, Piece> { return this.piecesSignal[0](); }
    get currentTurn(): Color { return this.turnSignal[0](); }
    get lastMove(): { from: Position; to: Position } | null { return this.lastMoveSignal[0](); }
    get enPassantTarget(): Position | null { return this.enPassantTargetSignal[0](); }
    get moves(): Array<string> { return this.movesSignal[0](); }
    get capturedPieces(): Array<Piece> { return this.capturedPiecesSignal[0](); }
    get materialScore(): number { return this.materialScoreSignal[0](); }

    private get halfmoveClock(): number { return this.halfmoveClockSignal[0](); }
    private get positionCounts(): Map<string, number> { return this.positionCountsSignal[0](); }

    private board(): BoardState {
        return createBoardState(this.pieces, this.enPassantTarget);
    }

    private readonly checkedKingPositionMemo = createMemo<Position | null>(() => {
        const board: BoardState = this.board();
        const color: Color = this.currentTurn;

        if (!isKingInCheck(this.pieces, board, color)) return null;
        return findKing(this.pieces, color)?.position ?? null;
    });

    get checkedKingPosition(): Position | null { return this.checkedKingPositionMemo(); }

    private readonly boardStatusMemo = createMemo<GameStatus>(() => {
        const color: Color = this.currentTurn;

        if (!this.hasAnyLegalMoves(color)) {
            if (this.checkedKingPosition) {
                const winner: Color = color === "white" ? "black" : "white";
                return { status: "checkmate", winner };
            }

            return { status: "stalemate" };
        }

        if (isInsufficientMaterial(this.pieces)) {
            return { status: "draw", reason: "insufficient-material" };
        }

        if (this.halfmoveClock >= FIFTY_MOVE_HALFMOVE_LIMIT) {
            return { status: "draw", reason: "fifty-move" };
        }

        const key = positionKey(this.pieces, color, this.enPassantTarget);
        if ((this.positionCounts.get(key) ?? 0) >= THREEFOLD_REPETITION_COUNT) {
            return { status: "draw", reason: "threefold-repetition" };
        }

        return { status: "playing" };
    });

    private get boardStatus(): GameStatus { return this.boardStatusMemo(); }

    private readonly statusMemo = createMemo<GameStatus>(() => this.overrideSignal[0]() ?? this.boardStatus);

    get status(): GameStatus { return this.statusMemo(); }

    private hasAnyLegalMoves(color: Color): boolean {
        for (const piece of this.pieces.values()) {
            if (piece.color === color && this.legalMovesFor(piece).size > 0) return true;
        }

        return false;
    }

    private isMoveSafe(piece: Piece, from: Position, to: Position): boolean {
        const opponent: Color = piece.color === "white" ? "black" : "white";

        const fileDelta: number = FILES.indexOf(to.file) - FILES.indexOf(from.file);
        if (piece.notation === "K" && Math.abs(fileDelta) === 2) {
            const currentBoard: BoardState = this.board();
            if (isSquareAttacked(this.pieces, currentBoard, from, opponent)) return false;

            const transitSquare: Position = new Position(fileDelta > 0 ? "f" : "d", from.rank);
            if (isSquareAttacked(this.pieces, currentBoard, transitSquare, opponent)) return false;
        }

        const simulated: Map<AlgebraicPosition, Piece> = simulateMove(this.pieces, from, to);
        const simulatedBoard: BoardState = createBoardState(simulated);
        return !isKingInCheck(simulated, simulatedBoard, piece.color);
    }

    legalMovesFor(piece: Piece): Set<AlgebraicPosition> {
        const board: BoardState = this.board();
        const moves: Array<Position> = piece.getPseudoLegalMoves(board)
            .filter((to) => this.isMoveSafe(piece, piece.position, to));

        return new Set(moves.map((pos) => pos.toAlgebraic()));
    }

    isLegalMove(piece: Piece, to: Position): boolean {
        return this.legalMovesFor(piece).has(to.toAlgebraic());
    }

    previewCapture(from: Position, to: Position): CaptureInfo | null {
        const piece: Piece | undefined = this.pieces.get(from.toAlgebraic());
        if (!piece) return null;

        const capturedAtTo: Piece | undefined = this.pieces.get(to.toAlgebraic());
        if (capturedAtTo) return { piece: capturedAtTo, square: to };

        const enPassantSquare: Position | null = getEnPassantCaptureSquare(piece, from, to, capturedAtTo);
        if (enPassantSquare) {
            const captured: Piece | undefined = this.pieces.get(enPassantSquare.toAlgebraic());
            if (captured) return { piece: captured, square: enPassantSquare };
        }

        return null;
    }

    move(from: Position, to: Position, promotion?: PromotionPieceType): Piece | null {
        if (from.toAlgebraic() === to.toAlgebraic()) return null;

        const map: Map<AlgebraicPosition, Piece> = this.pieces;
        const piece: Piece | undefined = map.get(from.toAlgebraic());
        if (!piece) return null;

        const capturedAtTo: Piece | undefined = map.get(to.toAlgebraic());
        const enPassantSquare: Position | null = getEnPassantCaptureSquare(piece, from, to, capturedAtTo);
        const captured: Piece | null = capturedAtTo ?? (enPassantSquare ? map.get(enPassantSquare.toAlgebraic()) ?? null : null);

        if (captured) {
            const delta: Value = captured.value;
            this.setMaterialScore((score) => score + (captured.color === "white" ? -delta : delta));
            this.setCapturedPieces((prev) => [...prev, captured]);
        }

        if (piece.notation === "P" || captured) {
            this.setHalfmoveClock(0);
        } else {
            this.setHalfmoveClock((n) => n + 1);
        }

        const next: Map<AlgebraicPosition, Piece> = new Map(map);
        if (enPassantSquare) next.delete(enPassantSquare.toAlgebraic());
        relocate(next, piece, from, to);

        const castlingRook: { from: Position, to: Position } | null = getCastlingRookMove(piece, from, to);
        if (castlingRook) {
            const rook: Piece | undefined = next.get(castlingRook.from.toAlgebraic());
            if (rook) relocate(next, rook, castlingRook.from, castlingRook.to);
        }

        if (promotion) {
            const promoted: Piece = createPromotionPiece(promotion, piece.color, to);
            promoted.hasMoved = true;
            next.set(to.toAlgebraic(), promoted);

            const materialGain: number = promoted.value - piece.value;
            this.setMaterialScore((score) => score + (piece.color === "white" ? materialGain : -materialGain));
        }

        this.setPieces(next);
        this.setEnPassantTarget(getEnPassantTarget(piece, from, to));
        this.setLastMove({ from, to });

        this.toggleTurn();

        this.recordPosition();
        this.recordMove(piece, from, to, captured, promotion);

        return captured;
    }

    private toggleTurn(): void {
        this.setTurn((prev) => (prev === "white" ? "black" : "white"));
    }

    private recordMove(
        piece: Piece,
        from: Position,
        to: Position,
        captured: Piece | null,
        promotion?: PromotionPieceType,
    ): void {
        const suffix: "#" | "+" | "" = this.boardStatus.status === "checkmate" ? "#" : this.checkedKingPosition ? "+" : "";
        this.setMoves((prev) => [...prev, toAlgebraicNotation(piece, from, to, captured, promotion) + suffix]);
    }

    private recordPosition(): void {
        const key: string = positionKey(this.pieces, this.currentTurn, this.enPassantTarget);
        this.setPositionCounts((prev) => {
            const next: Map<string, number> = new Map(prev);
            next.set(key, (next.get(key) ?? 0) + 1);
            return next;
        });
    }

    setOverride(status: GameStatus | null): void {
        this.overrideSignal[1](status);
    }

    reset(): void {
        const startingMap: Map<AlgebraicPosition, Piece> = createStartingPositionMap();

        this.setPieces(startingMap);
        this.setTurn("white");
        this.setLastMove(null);
        this.setEnPassantTarget(null);
        this.setHalfmoveClock(0);
        this.setPositionCounts(new Map([[positionKey(startingMap, "white", null), 1]]));
        this.setMoves([]);
        this.setCapturedPieces([]);
        this.setMaterialScore(0);
        this.setOverride(null);
    }
}
