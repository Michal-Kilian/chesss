import { Navigator, useNavigate } from "@solidjs/router";
import { BotIcon, CircleIcon, GlobeIcon, HourglassIcon, LucideIcon, RocketIcon, ShuffleIcon, SlidersHorizontalIcon, ZapIcon } from "lucide-solid";
import { Component, createMemo, createSignal, For } from "solid-js";
import { OptionButton } from "~/components/option-button";
import {
    ClockConfig,
    clampCustomIncrement,
    clampCustomMinutes,
    CUSTOM_INCREMENT_MAX,
    CUSTOM_INCREMENT_MIN,
    CUSTOM_MINUTES_MAX,
    CUSTOM_MINUTES_MIN,
    TIME_CONTROL_CATEGORY_LABELS,
    TIME_CONTROL_GROUPS,
    TIME_CONTROL_PRESETS,
    TimeControlCategory,
} from "~/lib/clock";
import { buildGameUrl, Opponent } from "~/lib/game-setup";
import { Color } from "~/lib/types";

type ColorChoice = Color | "random";
type TimeMode = "none" | "preset" | "custom";

const CATEGORY_ICONS: Record<TimeControlCategory, LucideIcon> = {
    bullet: RocketIcon,
    blitz: ZapIcon,
    rapid: HourglassIcon,
};

interface Bot {
    id: number;
    name: string;
    description: string;
}

const BOTS: ReadonlyArray<Bot> = [
    { id: 1, name: "Rookie", description: "Easy" },
    { id: 2, name: "Challenger", description: "Medium" },
    { id: 3, name: "Master", description: "Hard" },
];

const Home: Component = () => {
    const navigate: Navigator = useNavigate();

    const [opponent, setOpponent] = createSignal<Opponent>("bot");
    const [botId, setBotId] = createSignal<number>(1);
    const [colorChoice, setColorChoice] = createSignal<ColorChoice>("random");

    const [timeMode, setTimeMode] = createSignal<TimeMode>("none");
    const [presetIndex, setPresetIndex] = createSignal<number>(0);
    const [customMinutes, setCustomMinutes] = createSignal<number>(15);
    const [customIncrement, setCustomIncrement] = createSignal<number>(0);

    const resolvedColor = createMemo<string>(() => {
        const choice: ColorChoice = colorChoice();
        return choice === "random" ? "Random" : choice === "white" ? "White" : "Black";
    });

    const resolvedTimeControl = createMemo<ClockConfig | null>(() => {
        switch (timeMode()) {
            case "preset":
                return TIME_CONTROL_PRESETS[presetIndex()] ?? null;
            case "custom":
                return {
                    baseSeconds: clampCustomMinutes(customMinutes()) * 60,
                    incrementSeconds: clampCustomIncrement(customIncrement()),
                };
            default:
                return null;
        }
    });

    const startGame = () => {
        const color: Color = colorChoice() === "random"
            ? (Math.random() < 0.5 ? "white" : "black")
            : (colorChoice() as Color);

        navigate(buildGameUrl({
            opponent: opponent(),
            botId: botId(),
            color,
            timeControl: resolvedTimeControl(),
        }));
    };

    return (
        <div class="min-h-screen w-full flex items-center justify-center bg-neutral-900 text-foreground p-6">
            <div class="w-full max-w-xl flex flex-col gap-7 rounded-xl bg-neutral-800 p-8">
                <div class="text-center">
                    <h1 class="text-2xl font-semibold text-neutral-100">Chess</h1>
                    <p class="mt-1 text-sm text-neutral-400">Set up your game</p>
                </div>

                <section class="flex flex-col gap-3">
                    <h2 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Opponent</h2>

                    <div class="grid grid-cols-2 gap-3">
                        <OptionButton
                            label="Play a Bot"
                            icon={<BotIcon class="size-5" />}
                            active={opponent() === "bot"}
                            onClick={() => setOpponent("bot")}
                        />
                        <OptionButton
                            label="Play Online"
                            icon={<GlobeIcon class="size-5" />}
                            badge="Soon"
                            disabled
                        />
                    </div>

                    <div
                        class="grid transition-[grid-template-rows] duration-300 ease-in-out"
                        classList={{
                            "grid-rows-[1fr]": opponent() === "bot",
                            "grid-rows-[0fr]": opponent() !== "bot",
                        }}
                    >
                        <div class="overflow-hidden -m-2 p-2">
                            <div
                                class="grid grid-cols-3 gap-3 transition-opacity duration-300"
                                classList={{
                                    "opacity-100": opponent() === "bot",
                                    "opacity-0": opponent() !== "bot",
                                }}
                            >
                                <For each={BOTS}>
                                    {(bot) => (
                                        <OptionButton
                                            label={bot.name}
                                            sublabel={bot.description}
                                            badge={bot.id !== 1 ? "Soon" : undefined}
                                            active={opponent() === "bot" && botId() === bot.id}
                                            disabled={bot.id !== 1}
                                            onClick={() => setBotId(bot.id)}
                                        />
                                    )}
                                </For>
                            </div>
                        </div>
                    </div>
                </section>

                <div
                    class="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    classList={{
                        "grid-rows-[1fr]": opponent() === "bot",
                        "grid-rows-[0fr]": opponent() !== "bot",
                    }}
                >
                    <div class="overflow-hidden">
                        <section
                            class="flex flex-col gap-3 transition-opacity duration-300"
                            classList={{
                                "opacity-100": opponent() === "bot",
                                "opacity-0": opponent() !== "bot",
                            }}
                        >
                            <h2 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                Your color <span class="normal-case text-neutral-600">- {resolvedColor()}</span>
                            </h2>

                            <div class="grid grid-cols-3 gap-3">
                                <OptionButton
                                    label="White"
                                    icon={<CircleIcon class="size-5 fill-neutral-100 text-neutral-100" />}
                                    active={colorChoice() === "white"}
                                    onClick={() => setColorChoice("white")}
                                />
                                <OptionButton
                                    label="Random"
                                    icon={<ShuffleIcon class="size-5" />}
                                    active={colorChoice() === "random"}
                                    onClick={() => setColorChoice("random")}
                                />
                                <OptionButton
                                    label="Black"
                                    icon={<CircleIcon class="size-5 fill-neutral-950 text-neutral-950" />}
                                    active={colorChoice() === "black"}
                                    onClick={() => setColorChoice("black")}
                                />
                            </div>
                        </section>
                    </div>
                </div>

                <section class="flex flex-col gap-3">
                    <h2 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Time control</h2>

                    <div class="grid grid-cols-2 gap-2">
                        <OptionButton
                            label="No clock"
                            active={timeMode() === "none"}
                            onClick={() => setTimeMode("none")}
                        />
                        <OptionButton
                            label="Custom"
                            icon={<SlidersHorizontalIcon class="size-5" />}
                            active={timeMode() === "custom"}
                            onClick={() => setTimeMode("custom")}
                        />
                    </div>

                    <div
                        class="grid transition-[grid-template-rows] duration-300 ease-in-out"
                        classList={{
                            "grid-rows-[1fr]": timeMode() === "custom",
                            "grid-rows-[0fr]": timeMode() !== "custom",
                        }}
                    >
                        <div class="overflow-hidden">
                            <div
                                class="flex items-center gap-3 pt-2 transition-opacity duration-300"
                                classList={{
                                    "opacity-100": timeMode() === "custom",
                                    "opacity-0": timeMode() !== "custom",
                                }}
                            >
                                <label class="flex flex-1 flex-col gap-1">
                                    <span class="text-xs text-neutral-500">Minutes per side</span>
                                    <input
                                        type="number"
                                        min={CUSTOM_MINUTES_MIN}
                                        max={CUSTOM_MINUTES_MAX}
                                        value={Number.isFinite(customMinutes()) ? customMinutes() : ""}
                                        onInput={(e) => setCustomMinutes(e.currentTarget.valueAsNumber)}
                                        onBlur={() => setCustomMinutes((minutes) => clampCustomMinutes(minutes))}
                                        class="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-neutral-400"
                                    />
                                </label>

                                <label class="flex flex-1 flex-col gap-1">
                                    <span class="text-xs text-neutral-500">Increment (sec)</span>
                                    <input
                                        type="number"
                                        min={CUSTOM_INCREMENT_MIN}
                                        max={CUSTOM_INCREMENT_MAX}
                                        value={Number.isFinite(customIncrement()) ? customIncrement() : ""}
                                        onInput={(e) => setCustomIncrement(e.currentTarget.valueAsNumber)}
                                        onBlur={() => setCustomIncrement((increment) => clampCustomIncrement(increment))}
                                        class="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-neutral-400"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <For each={TIME_CONTROL_GROUPS}>
                        {(group) => {
                            const Icon = CATEGORY_ICONS[group.category];

                            return (
                                <div class="flex flex-col gap-2">
                                    <div class="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                                        <Icon class="size-3.5" />
                                        {TIME_CONTROL_CATEGORY_LABELS[group.category]}
                                    </div>

                                    <div
                                        class="grid gap-2"
                                        classList={{
                                            "grid-cols-2": group.presets.length === 2,
                                            "grid-cols-3": group.presets.length === 3,
                                            "grid-cols-4": group.presets.length === 4,
                                        }}
                                    >
                                        <For each={group.presets}>
                                            {(entry) => (
                                                <OptionButton
                                                    label={entry.preset.label}
                                                    active={timeMode() === "preset" && presetIndex() === entry.index}
                                                    onClick={() => {
                                                        setTimeMode("preset");
                                                        setPresetIndex(entry.index);
                                                    }}
                                                />
                                            )}
                                        </For>
                                    </div>
                                </div>
                            );
                        }}
                    </For>
                </section>

                <button
                    type="button"
                    onClick={startGame}
                    class="cursor-pointer rounded-md bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
                >
                    Start Game
                </button>
            </div>
        </div>
    );
};

export default Home;
