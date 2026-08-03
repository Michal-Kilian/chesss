import { useNavigate, useSearchParams } from "@solidjs/router";
import { ArrowLeftIcon } from "lucide-solid";
import { Component, createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import { Board, BoardAPI } from "~/components/board";
import { PlayerCard } from "~/components/player-card";
import { Bot, BotMove, createBot } from "~/lib/bots";
import { GameState } from "~/lib/game-state";
import { Opponent, parseBotIdParam, parseColorParam, parseOpponentParam, parseTimeControlParam } from "~/lib/game-setup";
import { findOpening, OpeningMatch } from "~/lib/openings";
import { Piece } from "~/lib/pieces/piece";
import { Color } from "~/lib/types";
import { ClockConfig } from "~/lib/clock";

const EVAL_SPREAD: number = 6;
const DUMMY_ELO: number = 1200;
const CLOCK_TICK_MS: number = 100;
const BOT_MOVE_DELAY_MS: number = 500;
const BOT_DRAW_RESPONSE_DELAY_MS: number = 500;

const whiteShare = (score: number): number => 50 + 50 * Math.tanh(score / EVAL_SPREAD);

const advantageFor = (side: Color, score: number): number => {
    const advantage = side === "white" ? score : -score;
    return advantage > 0 ? advantage : 0;
};

const capturedBy = (side: Color, pieces: Array<Piece>): Array<Piece> =>
    pieces.filter((piece) => piece.color !== side);

const opponentOf = (color: Color): Color => (color === "white" ? "black" : "white");

interface MovePair {
    turn: number;
    white: string;
    black?: string;
}

const toMovePairs = (moves: Array<string>): Array<MovePair> => {
    const pairs: Array<MovePair> = [];

    for (let i = 0; i < moves.length; i += 2) {
        pairs.push({ turn: i / 2 + 1, white: moves[i], black: moves[i + 1] });
    }

    return pairs;
};

const Game: Component = () => {
    const game: GameState = new GameState();

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const color: Color = parseColorParam(searchParams.c);
    const timeControl: ClockConfig | null = parseTimeControlParam(searchParams.t, searchParams.i);
    const opponent: Opponent = parseOpponentParam(searchParams.o);
    const bot: Bot | null = opponent === "bot" ? createBot(parseBotIdParam(searchParams.d)) : null;

    const [orientation, setOrientation] = createSignal<Color>(color);
    const [boardApi, setBoardApi] = createSignal<BoardAPI | null>(null);
    const [confirmingLeave, setConfirmingLeave] = createSignal<boolean>(false);

    const [whiteTimeMs, setWhiteTimeMs] = createSignal<number>(0);
    const [blackTimeMs, setBlackTimeMs] = createSignal<number>(0);

    const movePairs = createMemo(() => toMovePairs(game.moves));
    const opponentColor = createMemo<Color>(() => opponentOf(color));
    const currentOpening = createMemo<OpeningMatch | undefined>(() => findOpening(game.moves));
    const isGameOver = createMemo<boolean>(() => game.status.status !== "playing");
    const isBotTurn = createMemo<boolean>(() => bot !== null && !isGameOver() && game.currentTurn === opponentColor());

    createEffect(() => {
        if (!bot || !isBotTurn()) return;

        const thinkingBot: Bot = bot;
        const timeout: NodeJS.Timeout = setTimeout(() => {
            const move: BotMove | null = thinkingBot.chooseMove(game, opponentColor());
            if (!move) return;

            const api: BoardAPI | null = boardApi();
            if (api) api.playMove(move.from, move.to, move.promotion);
            else game.move(move.from, move.to, move.promotion);
        }, BOT_MOVE_DELAY_MS);

        onCleanup(() => clearTimeout(timeout));
    });

    const resetClocks = () => {
        setWhiteTimeMs(timeControl ? timeControl.baseSeconds * 1000 : 0);
        setBlackTimeMs(timeControl ? timeControl.baseSeconds * 1000 : 0);
    };
    resetClocks();

    let lastTick: number = Date.now();
    const tickInterval = setInterval(() => {
        const now: number = Date.now();
        const elapsed: number = now - lastTick;
        lastTick = now;

        if (!timeControl || isGameOver()) return;

        if (game.currentTurn === "white") {
            setWhiteTimeMs((ms) => Math.max(0, ms - elapsed));
        } else {
            setBlackTimeMs((ms) => Math.max(0, ms - elapsed));
        }
    }, CLOCK_TICK_MS);
    onCleanup(() => clearInterval(tickInterval));

    createEffect(() => {
        if (!timeControl || isGameOver()) return;

        if (whiteTimeMs() <= 0) game.setOverride({ status: "timeout", winner: "black" });
        else if (blackTimeMs() <= 0) game.setOverride({ status: "timeout", winner: "white" });
    });

    createEffect((prevTurn: Color) => {
        const turn: Color = game.currentTurn;

        if (prevTurn !== turn && timeControl && timeControl.incrementSeconds > 0) {
            const incrementMs: number = timeControl.incrementSeconds * 1000;
            if (prevTurn === "white") setWhiteTimeMs((ms) => ms + incrementMs);
            else setBlackTimeMs((ms) => ms + incrementMs);
        }

        return turn;
    }, game.currentTurn);

    const handleLeave = () => {
        if (isGameOver()) navigate("/");
        else setConfirmingLeave(true);
    };

    const handleResign = (resigningColor: Color) => {
        game.setOverride({ status: "resignation", winner: opponentOf(resigningColor) });
    };

    const handleOfferDraw = (offeringColor: Color) => {
        if (!bot || opponentOf(offeringColor) !== opponentColor()) return;

        setTimeout(() => {
            if (isGameOver()) return;
            if (bot.respondToDrawOffer(game, opponentColor())) {
                game.setOverride({ status: "draw", reason: "agreement" });
            }
        }, BOT_DRAW_RESPONSE_DELAY_MS);
    };

    return (
        <div class="relative h-screen w-full flex flex-row items-center justify-center overflow-hidden bg-neutral-900 text-foreground gap-8">
            <aside class="flex w-full max-w-72 bg-neutral-800 self-stretch overflow-hidden gap-4 p-4">
                <div class="flex-1 min-h-0 flex flex-col gap-2">
                    <button
                        type="button"
                        title="Leave game"
                        onClick={handleLeave}
                        class="cursor-pointer -m-1 self-start rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-100"
                    >
                        <ArrowLeftIcon class="size-5" />
                    </button>

                    <Show when={currentOpening()}>
                        {(opening) => (
                            <div class="text-xs text-neutral-400 border-b border-neutral-700 pb-2">
                                <span class="text-neutral-500">{opening().eco}</span>{" "}
                                <span>{opening().name}</span>
                            </div>
                        )}
                    </Show>

                    <div class="flex-1 overflow-y-auto flex flex-col gap-1 text-sm text-neutral-300">
                        <For each={movePairs()}>
                            {(pair) => (
                                <div class="flex gap-2">
                                    <span class="w-6 shrink-0 text-neutral-500 tabular-nums">{pair.turn}.</span>
                                    <span class="flex-1">{pair.white}</span>
                                    <span class="flex-1">{pair.black ?? ""}</span>
                                </div>
                            )}
                        </For>
                    </div>
                </div>

                <div class="w-3 outline-1 outline-neutral-600 shrink-0 self-stretch rounded-full bg-neutral-900 overflow-hidden flex flex-col-reverse">
                    <div
                        class="w-full bg-neutral-100 transition-[height] duration-500 ease-out"
                        style={{ height: `${whiteShare(game.materialScore)}%` }}
                    />
                </div>
            </aside>

            <Board
                game={game}
                orientation={orientation}
                setOrientation={setOrientation}
                onNewGame={resetClocks}
                locked={isBotTurn}
                registerApi={(api) => setBoardApi(() => api)}
            />

            <aside class="flex flex-col w-full max-w-72 bg-neutral-800 self-stretch p-4 gap-3">
                <div class="flex-1 flex flex-col justify-between">
                    <PlayerCard
                        color={opponentColor()}
                        name={bot?.name ?? (opponentColor() === "white" ? "White Player" : "Black Player")}
                        elo={DUMMY_ELO}
                        isTurn={() => game.currentTurn === opponentColor()}
                        advantage={() => advantageFor(opponentColor(), game.materialScore)}
                        capturedPieces={() => capturedBy(opponentColor(), game.capturedPieces)}
                        timeMs={() => (timeControl ? (opponentColor() === "white" ? whiteTimeMs() : blackTimeMs()) : null)}
                        canAct={() => !isGameOver()}
                        onResign={() => handleResign(opponentColor())}
                        onOfferDraw={() => handleOfferDraw(opponentColor())}
                    />

                    <PlayerCard
                        color={color}
                        name={color === "white" ? "White Player" : "Black Player"}
                        elo={DUMMY_ELO}
                        isTurn={() => game.currentTurn === color}
                        advantage={() => advantageFor(color, game.materialScore)}
                        capturedPieces={() => capturedBy(color, game.capturedPieces)}
                        timeMs={() => (timeControl ? (color === "white" ? whiteTimeMs() : blackTimeMs()) : null)}
                        canAct={() => !isGameOver()}
                        onResign={() => handleResign(color)}
                        onOfferDraw={() => handleOfferDraw(color)}
                    />
                </div>
            </aside>

            <Show when={confirmingLeave()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div class="flex flex-col items-center gap-4 rounded-lg bg-neutral-800 px-8 py-6 text-center shadow-xl">
                        <span class="text-lg font-semibold text-neutral-100">Leave game?</span>
                        <span class="max-w-xs text-sm text-neutral-400">
                            The game is still in progress. If you leave now, it will be lost.
                        </span>

                        <div class="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmingLeave(false)}
                                class="cursor-pointer rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                class="cursor-pointer rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-400"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
};

export default Game;