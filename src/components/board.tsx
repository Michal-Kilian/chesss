import { Accessor, Component, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { RotateCcwIcon } from "lucide-solid";
import { Square } from "./square";
import { FILES, RANKS } from "~/lib/setup";
import { Piece } from "../lib/pieces/piece";
import { Position } from "../lib/position";
import { AlgebraicPosition, Color, Coordinates, File, PromotionPieceType, Rank } from "~/lib/types";
import { GameState } from "~/lib/game-state";
import { describeGameStatus } from "~/lib/status-message";
import { createPromotionPiece, isPromotionMove, PROMOTION_PIECE_TYPES } from "~/lib/promotion";

const MOVE_ANIMATION_MS: number = 150;

export interface BoardAPI {
    playMove(from: Position, to: Position, promotion?: PromotionPieceType): void;
}

interface BoardProps {
    game: GameState;
    orientation: Accessor<Color>;
    setOrientation: Setter<Color>;
    onNewGame: () => void;
    locked?: Accessor<boolean>;
    registerApi?: (api: BoardAPI) => void;
}

export const Board: Component<BoardProps> = (props: BoardProps) => {
    const [selectedPiece, setSelectedPiece] = createSignal<Piece | null>(null);
    const [draggedPiece, setDraggedPiece] = createSignal<Piece | null>(null);
    const [dragPos, setDragPos] = createSignal<Coordinates | null>(null);

    const [animatingPiece, setAnimatingPiece] = createSignal<Piece | null>(null);
    const [animPos, setAnimPos] = createSignal<Coordinates | null>(null);
    const [fadingCapture, setFadingCapture] = createSignal<{
        icon: string;
        pos: Coordinates;
    } | null>(null);
    const [pendingPromotion, setPendingPromotion] = createSignal<{
        piece: Piece;
        from: Position;
        to: Position;
        center: Coordinates;
    } | null>(null);

    let boardEl: HTMLDivElement | undefined;
    let squareSize: number = 0;

    const displayRanks = createMemo<Array<Rank>>(() => [...RANKS].reverse());

    const updateSquareSize = () => {
        if (boardEl) squareSize = boardEl.clientWidth / 8;
    };

    const getSquareCenter = (position: Position): Coordinates | null => {
        if (!boardEl) return null;
        const el = boardEl.querySelector(`[data-position="${position.toAlgebraic()}"]`);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const displayPieces = createMemo<Map<AlgebraicPosition, Piece>>(() => {
        const pending = pendingPromotion();
        const pieces = props.game.pieces;
        if (!pending) return pieces;

        const next = new Map(pieces);
        next.delete(pending.from.toAlgebraic());
        next.set(pending.to.toAlgebraic(), pending.piece);
        return next;
    });

    const animateAndMove = (from: Position, to: Position, promotion?: PromotionPieceType) => {
        const piece = props.game.pieces.get(from.toAlgebraic());
        if (!piece) return;

        updateSquareSize();

        const fromCenter = getSquareCenter(from);
        const toCenter = getSquareCenter(to);

        if (!fromCenter || !toCenter) {
            props.game.move(from, to, promotion);
            return;
        }

        const preview = props.game.previewCapture(from, to);
        if (preview) {
            const captureCenter = getSquareCenter(preview.square);
            if (captureCenter) {
                setFadingCapture({ icon: preview.piece.icon, pos: captureCenter });
                setTimeout(() => setFadingCapture(null), MOVE_ANIMATION_MS);
            }
        }

        setDraggedPiece(piece);
        setAnimatingPiece(piece);
        setAnimPos(fromCenter);

        props.game.move(from, to, promotion);

        requestAnimationFrame(() => {
            setAnimPos(toCenter);
        });

        setTimeout(() => {
            setDraggedPiece(null);
            setAnimatingPiece(null);
            setAnimPos(null);
        }, MOVE_ANIMATION_MS);
    };

    props.registerApi?.({ playMove: animateAndMove });

    const beginPromotion = (piece: Piece, from: Position, to: Position) => {
        updateSquareSize();
        const center = getSquareCenter(to) ?? { x: 0, y: 0 };
        setPendingPromotion({ piece, from, to, center });
    };

    const completePromotion = (type: PromotionPieceType) => {
        const pending = pendingPromotion();
        if (!pending) return;

        props.game.move(pending.from, pending.to, type);
        setPendingPromotion(null);
    };

    const handleSquareInteraction = (position: Position) => {
        if (!canInteract() || pendingPromotion()) return;

        const pieceHere = props.game.pieces.get(position.toAlgebraic());
        const selected = selectedPiece();

        if (selected) {
            const from = selected.position;
            if (
                from.toAlgebraic() !== position.toAlgebraic() &&
                props.game.isLegalMove(selected, position)
            ) {
                if (isPromotionMove(selected, position)) {
                    beginPromotion(selected, from, position);
                    setSelectedPiece(null);
                    return;
                }

                animateAndMove(from, position);
                setSelectedPiece(null);
                return;
            }

            if (pieceHere && pieceHere !== selected && pieceHere.color === props.game.currentTurn) {
                setSelectedPiece(pieceHere);
                return;
            }

            setSelectedPiece(null);
        } else if (pieceHere && pieceHere.color === props.game.currentTurn) {
            setSelectedPiece(pieceHere);
        }
    };

    const handleDragStart = (piece: Piece, from: Position, e: PointerEvent) => {
        if (!canInteract() || pendingPromotion() || piece.color !== props.game.currentTurn) return;

        updateSquareSize();

        setSelectedPiece(null);
        setDraggedPiece(piece);
        setDragPos({ x: e.clientX, y: e.clientY });

        const handleMove = (moveEvent: PointerEvent) => {
            setDragPos({ x: moveEvent.clientX, y: moveEvent.clientY });
        };

        const handleUp = (upEvent: PointerEvent) => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
            window.removeEventListener("pointercancel", handleCancel);

            const elements = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
            const targetEl = elements.find((el) => el.hasAttribute("data-position"));
            const toKey = targetEl?.getAttribute("data-position") as AlgebraicPosition | undefined;

            if (toKey) {
                const to = Position.fromAlgebraic(toKey);
                if (props.game.isLegalMove(piece, to)) {
                    if (isPromotionMove(piece, to)) {
                        beginPromotion(piece, from, to);
                    } else {
                        props.game.move(from, to);
                    }
                }
            }

            setDraggedPiece(null);
            setDragPos(null);
        };

        const handleCancel = () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
            window.removeEventListener("pointercancel", handleCancel);
            setDraggedPiece(null);
            setDragPos(null);
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        window.addEventListener("pointercancel", handleCancel);
    };

    const draggedIcon = () => draggedPiece()?.icon;
    const animatingIcon = () => animatingPiece()?.icon;

    const activePiece = createMemo<Piece | null>(() => {
        if (animatingPiece()) return null;
        return selectedPiece() ?? draggedPiece();
    });

    const legalMoveTargets = createMemo<Set<AlgebraicPosition>>(() => {
        const piece = activePiece();
        if (!piece) return new Set();

        return props.game.legalMovesFor(piece);
    });

    const checkedKingPosition = (): Position | null => props.game.checkedKingPosition;
    const currentTurn = (): Color => props.game.currentTurn;
    const lastMove = (): { from: Position; to: Position } | null => props.game.lastMove;

    const isGameOver = (): boolean => props.game.status.status !== "playing";
    const canInteract = (): boolean => !isGameOver() && !(props.locked?.() ?? false);

    const gameOverMessage = createMemo<string>(() => describeGameStatus(props.game.status));

    const newGame = () => {
        setSelectedPiece(null);
        setDraggedPiece(null);
        setDragPos(null);
        setAnimatingPiece(null);
        setAnimPos(null);
        setFadingCapture(null);
        setPendingPromotion(null);
        props.game.reset();
        props.onNewGame();
    };

    const labelFiles = createMemo<Array<File>>(() => (
        props.orientation() === "white" ? FILES : [...FILES].reverse()
    ));
    const labelRanks = createMemo<Array<Rank>>(() => (
        props.orientation() === "white" ? [...RANKS].reverse() : RANKS
    ));

    const flipBoard = () => {
        props.setOrientation((o) => (o === "white" ? "black" : "white"));
    };

    return (
        <div class="flex items-center justify-center w-full h-full">
            <div
                ref={boardEl}
                class="relative"
                style={{
                    width: "min(85vmin, 680px)",
                    height: "min(85vmin, 680px)",
                }}
            >
                <div
                    class="grid grid-cols-8 grid-rows-8 w-full h-full transition-transform duration-500 ease-in-out"
                    classList={{ "rotate-180": props.orientation() === "black" }}
                >
                    <For each={displayRanks()}>
                        {(rank, rowIdx) => (
                            <For each={FILES}>
                                {(file, colIdx) => {
                                    const position = new Position(file, rank);
                                    const isLight = (): boolean => (rowIdx() + colIdx()) % 2 === 0;
                                    const piece = () => displayPieces().get(position.toAlgebraic());

                                    return (
                                        <Square
                                            position={position}
                                            isLight={isLight}
                                            piece={piece}
                                            selectedPiece={selectedPiece}
                                            draggedPiece={draggedPiece}
                                            animatingPiece={animatingPiece}
                                            legalMoveTargets={legalMoveTargets}
                                            checkedKingPosition={checkedKingPosition}
                                            currentTurn={currentTurn}
                                            lastMove={lastMove}
                                            orientation={props.orientation}
                                            onSquareClick={handleSquareInteraction}
                                            onDragStart={handleDragStart}
                                        />
                                    );
                                }}
                            </For>
                        )}
                    </For>
                </div>

                <button
                    type="button"
                    onClick={flipBoard}
                    title="Flip board"
                    class="cursor-pointer absolute -top-9 right-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
                >
                    <RotateCcwIcon class="size-4" />
                </button>

                <div class="absolute left-0 right-0 bottom-0 flex translate-y-full pt-2">
                    <For each={labelFiles()}>
                        {(file) => (
                            <div class="flex-1 flex items-center justify-center text-xs text-neutral-400 uppercase">
                                {file}
                            </div>
                        )}
                    </For>
                </div>

                <div class="absolute top-0 bottom-0 left-0 flex flex-col -translate-x-full pr-3">
                    <For each={labelRanks()}>
                        {(rank) => (
                            <div class="flex-1 flex items-center justify-center text-xs text-neutral-400">
                                {rank}
                            </div>
                        )}
                    </For>
                </div>

                <Show when={dragPos() && draggedIcon() && !animatingPiece()}>
                    <img
                        src={draggedIcon()}
                        class="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: `${dragPos()!.x}px`,
                            top: `${dragPos()!.y}px`,
                            width: `${squareSize * (5 / 6)}px`,
                            height: `${squareSize * (5 / 6)}px`,
                        }}
                    />
                </Show>

                <Show when={animPos() && animatingIcon()}>
                    <img
                        src={animatingIcon()}
                        class="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 transition-[left,top] ease-out"
                        style={{
                            left: `${animPos()!.x}px`,
                            top: `${animPos()!.y}px`,
                            width: `${squareSize * (5 / 6)}px`,
                            height: `${squareSize * (5 / 6)}px`,
                            "transition-duration": `${MOVE_ANIMATION_MS}ms`,
                        }}
                    />
                </Show>

                <Show when={fadingCapture()}>
                    {(capture) => (
                        <img
                            src={capture().icon}
                            class="fixed pointer-events-none z-40 -translate-x-1/2 -translate-y-1/2 transition-opacity ease-out"
                            style={{
                                left: `${capture().pos.x}px`,
                                top: `${capture().pos.y}px`,
                                width: `${squareSize * (5 / 6)}px`,
                                height: `${squareSize * (5 / 6)}px`,
                                opacity: 0,
                                "transition-duration": `${MOVE_ANIMATION_MS}ms`,
                            }}
                        />
                    )}
                </Show>

                <Show when={pendingPromotion()}>
                    {(pending) => {
                        const isNearTop = () => pending().piece.color === props.orientation();

                        return (
                            <div
                                class="fixed z-50 flex flex-col overflow-hidden rounded-lg bg-neutral-800 shadow-xl"
                                style={{
                                    left: `${pending().center.x}px`,
                                    top: isNearTop()
                                        ? `${pending().center.y - squareSize / 2}px`
                                        : `${pending().center.y + squareSize / 2}px`,
                                    transform: isNearTop()
                                        ? "translateX(-50%)"
                                        : "translateX(-50%) translateY(-100%)",
                                }}
                            >
                                <For each={PROMOTION_PIECE_TYPES}>
                                    {(type) => (
                                        <button
                                            type="button"
                                            class="cursor-pointer flex items-center justify-center p-1 transition-colors hover:bg-neutral-700"
                                            style={{ width: `${squareSize}px`, height: `${squareSize}px` }}
                                            onClick={() => completePromotion(type)}
                                        >
                                            <img
                                                src={createPromotionPiece(type, pending().piece.color, pending().to).icon}
                                                alt={type}
                                                class="w-5/6 h-5/6 pointer-events-none select-none"
                                            />
                                        </button>
                                    )}
                                </For>
                            </div>
                        );
                    }}
                </Show>

                <Show when={isGameOver()}>
                    <div class="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
                        <div class="flex flex-col items-center gap-4 rounded-lg bg-neutral-800 px-8 py-6 text-center shadow-xl">
                            <span class="text-lg font-semibold text-neutral-100">{gameOverMessage()}</span>

                            <button
                                type="button"
                                class="cursor-pointer rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
                                onClick={newGame}
                            >
                                New Game
                            </button>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
};
