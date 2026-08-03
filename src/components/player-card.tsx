import { Accessor, Component, createSignal, For, onCleanup, Show } from "solid-js";
import { CheckIcon, FlagIcon, HandshakeIcon, UserIcon, XIcon } from "lucide-solid";
import { Piece } from "~/lib/pieces/piece";
import { formatClock } from "~/lib/clock";
import { Color, Value } from "~/lib/types";

const DRAW_OFFER_TOAST_MS: number = 2500;
const LOW_TIME_MS: number = 10_000;

const VALUE_ORDER: Array<Value> = [1, 3, 5, 9];

const groupCapturesByValue = (pieces: Array<Piece>): Array<Array<Piece>> =>
    VALUE_ORDER
        .map((value) => pieces.filter((piece) => piece.value === value))
        .filter((group) => group.length > 0);

interface PlayerCardProps {
    color: Color;
    name: string;
    elo: number;
    isTurn: Accessor<boolean>;
    advantage: Accessor<number>;
    capturedPieces: Accessor<Array<Piece>>;
    timeMs: Accessor<number | null>;
    canAct: Accessor<boolean>;
    onResign: () => void;
    onOfferDraw?: () => void;
}

export const PlayerCard: Component<PlayerCardProps> = (props: PlayerCardProps) => {
    const [confirmingResign, setConfirmingResign] = createSignal<boolean>(false);
    const [drawOfferSent, setDrawOfferSent] = createSignal<boolean>(false);

    let drawToastTimeout: ReturnType<typeof setTimeout> | undefined;
    onCleanup(() => clearTimeout(drawToastTimeout));

    const handleOfferDraw = () => {
        setDrawOfferSent(true);
        clearTimeout(drawToastTimeout);
        drawToastTimeout = setTimeout(() => setDrawOfferSent(false), DRAW_OFFER_TOAST_MS);
        props.onOfferDraw?.();
    };

    const handleResign = () => {
        setConfirmingResign(false);
        props.onResign();
    };

    return (
        <div class="flex items-center justify-between gap-3" classList={{ "opacity-50": !props.isTurn() }}>
            <div class="flex items-center gap-3 min-w-0">
                <div class="relative shrink-0">
                    <div class="size-12 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden">
                        <UserIcon class="size-6 text-neutral-400" />
                    </div>

                    <Show when={props.isTurn()}>
                        <div class="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-neutral-100 ring-2 ring-neutral-800" />
                    </Show>
                </div>

                <div class="flex flex-col min-w-0">
                    <span class="text-sm font-medium text-neutral-100 truncate">{props.name}</span>
                    <span class="text-xs text-neutral-400">{props.elo}</span>

                    <div class="flex items-center gap-2 mt-1 min-h-4">
                        <Show when={props.advantage() > 0}>
                            <span class="text-xs font-semibold text-neutral-300">+{props.advantage()}</span>
                        </Show>

                        <div class="flex flex-wrap items-center">
                            <For each={groupCapturesByValue(props.capturedPieces())}>
                                {(group) => (
                                    <div class="flex">
                                        <For each={group}>
                                            {(piece, index) => (
                                                <img
                                                    src={piece.icon}
                                                    alt={`${piece.color} ${piece.name}`}
                                                    class="w-4 h-4"
                                                    classList={{ "-ml-2": index() > 0 }}
                                                />
                                            )}
                                        </For>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col items-end gap-1.5 shrink-0">
                <Show when={props.timeMs() !== null}>
                    <span
                        class="rounded px-2 py-1 font-mono text-sm tabular-nums"
                        classList={{
                            "bg-neutral-100 text-neutral-900": props.isTurn() && props.timeMs()! >= LOW_TIME_MS,
                            "bg-red-500 text-white": props.isTurn() && props.timeMs()! < LOW_TIME_MS,
                            "bg-neutral-700 text-neutral-400": !props.isTurn() && props.timeMs()! >= LOW_TIME_MS,
                            "bg-red-900 text-red-300": !props.isTurn() && props.timeMs()! < LOW_TIME_MS,
                        }}
                    >
                        {formatClock(props.timeMs()!)}
                    </span>
                </Show>

                <Show when={props.canAct()}>
                    <div class="flex items-center gap-1">
                        <Show when={drawOfferSent()}>
                            <span class="text-[10px] text-neutral-500">Draw offered</span>
                        </Show>

                        <button
                            type="button"
                            title="Offer draw"
                            class="cursor-pointer rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
                            onClick={handleOfferDraw}
                        >
                            <HandshakeIcon class="size-3.5" />
                        </button>

                        <Show
                            when={!confirmingResign()}
                            fallback={
                                <div class="flex items-center gap-1">
                                    <button
                                        type="button"
                                        title="Confirm resignation"
                                        class="cursor-pointer rounded p-1 text-red-400 transition-colors hover:bg-red-500/20"
                                        onClick={handleResign}
                                    >
                                        <CheckIcon class="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        title="Cancel"
                                        class="cursor-pointer rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700"
                                        onClick={() => setConfirmingResign(false)}
                                    >
                                        <XIcon class="size-3.5" />
                                    </button>
                                </div>
                            }
                        >
                            <button
                                type="button"
                                title="Resign"
                                class="cursor-pointer rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-700 hover:text-red-400"
                                onClick={() => setConfirmingResign(true)}
                            >
                                <FlagIcon class="size-3.5" />
                            </button>
                        </Show>
                    </div>
                </Show>
            </div>
        </div>
    );
};
