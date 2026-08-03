import { Accessor, Component, Show } from "solid-js";
import { Piece } from "../lib/pieces/piece";
import { Position } from "../lib/position";
import { AlgebraicPosition, Color, Coordinates } from "~/lib/types";

const DRAG_THRESHOLD_PX: number = 4;

interface SquareProps {
    position: Position;
    isLight: Accessor<boolean>;
    piece: Accessor<Piece | undefined>;
    selectedPiece: Accessor<Piece | null>;
    draggedPiece: Accessor<Piece | null>;
    animatingPiece: Accessor<Piece | null>;
    legalMoveTargets: Accessor<Set<AlgebraicPosition>>;
    checkedKingPosition: Accessor<Position | null>;
    currentTurn: Accessor<Color>;
    lastMove: Accessor<{ from: Position; to: Position } | null>;
    orientation: Accessor<Color>;
    onSquareClick: (position: Position) => void;
    onDragStart: (piece: Piece, from: Position, e: PointerEvent) => void;
}

export const Square: Component<SquareProps> = (props: SquareProps) => {
    const hasPiece = (): boolean => props.piece() !== undefined;
    const hasSelectedPiece = (): boolean => props.piece() === props.selectedPiece();
    const isBeingDragged = (): boolean => props.piece() === props.draggedPiece();
    const isBeingAnimated = (): boolean => props.piece() === props.animatingPiece();
    const isLegalTarget = (): boolean => props.legalMoveTargets().has(props.position.toAlgebraic());
    const isLegalCapture = (): boolean => isLegalTarget() && hasPiece();
    const isInCheck = (): boolean => props.checkedKingPosition()?.toAlgebraic() === props.position.toAlgebraic();
    const isLastMove = (): boolean => {
        const move = props.lastMove();
        if (!move) return false;
        const key = props.position.toAlgebraic();
        return move.from.toAlgebraic() === key || move.to.toAlgebraic() === key;
    };
    const isPickable = (): boolean => props.piece()?.color === props.currentTurn();

    let pointerDownPos: Coordinates | null = null;
    let dragStarted = false;
    let activePointerId: number | null = null;

    const handleSquareClick = () => {
        if (dragStarted) return;
        props.onSquareClick(props.position);
    };

    const handlePointerDown = (e: PointerEvent) => {
        e.preventDefault();

        const piece: Piece | undefined = props.piece();
        if (!piece) return;

        pointerDownPos = { x: e.clientX, y: e.clientY };
        dragStarted = false;
        activePointerId = e.pointerId;

        const target: HTMLElement = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        const handleMove = (moveEvent: PointerEvent) => {
            if (moveEvent.pointerId !== activePointerId) return;
            if (dragStarted || !pointerDownPos) return;

            const dx: number = moveEvent.clientX - pointerDownPos.x;
            const dy: number = moveEvent.clientY - pointerDownPos.y;
            if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
                dragStarted = true;
                target.removeEventListener("pointermove", handleMove);
                props.onDragStart(piece, props.position, moveEvent);
            }
        };

        const cleanup = () => {
            target.removeEventListener("pointermove", handleMove);
            target.removeEventListener("pointerup", cleanup);
            target.removeEventListener("pointercancel", cleanup);
            pointerDownPos = null;
            activePointerId = null;
        };

        target.addEventListener("pointermove", handleMove);
        target.addEventListener("pointerup", cleanup);
        target.addEventListener("pointercancel", cleanup);
    };

    const handlePointerUp = (e: PointerEvent) => {
        const target: HTMLElement = e.currentTarget as HTMLElement;
        if (target.hasPointerCapture(e.pointerId)) {
            target.releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div
            class="group flex items-center justify-center relative overflow-hidden"
            classList={{
                "bg-neutral-400": props.isLight(),
                "bg-neutral-600": !props.isLight(),
                "cursor-grab": isPickable(),
                "cursor-pointer": !isPickable() && isLegalTarget(),
            }}
            onClick={handleSquareClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            data-position={props.position.toAlgebraic()}
            style={{ "touch-action": "none" }}
        >
            <div
                class="absolute inset-0 bg-amber-300/25 z-0 pointer-events-none transition-opacity duration-150 ease-out"
                classList={{ "opacity-100": isLastMove(), "opacity-0": !isLastMove() }}
            />

            <div
                class="absolute inset-0 bg-white/25 ring-2 ring-inset ring-white/70 z-0 pointer-events-none transition-opacity duration-150 ease-out"
                classList={{ "opacity-100": hasSelectedPiece(), "opacity-0": !hasSelectedPiece() }}
            />

            <div
                class="absolute inset-0 bg-red-500/50 z-0 pointer-events-none transition-opacity duration-300 ease-out"
                classList={{
                    "opacity-100": isInCheck(),
                    "opacity-0": !isInCheck(),
                }}
            />

            <div
                class="absolute w-1/3 h-1/3 rounded-full bg-black/25 pointer-events-none z-10 transition-transform duration-150 ease-out"
                classList={{
                    "scale-100": isLegalTarget() && !hasPiece(),
                    "scale-0": !(isLegalTarget() && !hasPiece()),
                }}
            />

            <div
                class="absolute inset-0 rounded-full ring-4 ring-inset ring-black/25 pointer-events-none z-10 transition-transform duration-150 ease-out"
                classList={{
                    "scale-100": isLegalCapture(),
                    "scale-0": !isLegalCapture(),
                }}
            />

            <Show when={props.piece()}>
                {(piece) => (
                    <img
                        src={piece().icon}
                        alt={`${piece().color} ${piece().name}`}
                        class="relative z-20 w-5/6 h-5/6 select-none pointer-events-none transition-transform duration-500 ease-in-out"
                        classList={{
                            "opacity-0": isBeingDragged() || isBeingAnimated(),
                            "rotate-180": props.orientation() === "black",
                        }}
                        draggable={false}
                        ondragstart={(e) => e.preventDefault()}
                    />
                )}
            </Show>
        </div>
    );
};
