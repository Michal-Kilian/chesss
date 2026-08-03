import { ClockConfig, clampCustomIncrement, clampCustomMinutes } from "./clock";
import { Color } from "./types";

export type Opponent = "bot" | "online";

export interface GameSetup {
    opponent: Opponent;
    botId: number;
    color: Color;
    timeControl: ClockConfig | null;
}

export const buildGameUrl = (setup: GameSetup): string => {
    const params: URLSearchParams = new URLSearchParams();
    params.set("o", setup.opponent);
    if (setup.opponent === "bot") params.set("d", String(setup.botId));
    params.set("c", setup.color === "white" ? "w" : "b");
    if (setup.timeControl !== null) {
        params.set("t", String(setup.timeControl.baseSeconds));
        params.set("i", String(setup.timeControl.incrementSeconds));
    }

    return `/game?${params.toString()}`;
};

const first = (value: string | Array<string> | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

export const parseColorParam = (value: string | Array<string> | undefined): Color =>
    first(value) === "b" ? "black" : "white";

export const parseTimeControlParam = (
    baseValue: string | Array<string> | undefined,
    incrementValue: string | Array<string> | undefined,
): ClockConfig | null => {
    const baseSeconds = Number(first(baseValue));
    if (!Number.isFinite(baseSeconds) || baseSeconds <= 0) return null;

    const minutes = clampCustomMinutes(baseSeconds / 60);
    const incrementSeconds = clampCustomIncrement(Number(first(incrementValue)) || 0);

    return { baseSeconds: minutes * 60, incrementSeconds };
};

export const parseOpponentParam = (value: string | Array<string> | undefined): Opponent =>
    first(value) === "online" ? "online" : "bot";

export const parseBotIdParam = (value: string | Array<string> | undefined): number => {
    const id = Number(first(value));
    return Number.isInteger(id) ? id : 1;
};
