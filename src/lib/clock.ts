export type TimeControlCategory = "bullet" | "blitz" | "rapid";

export interface ClockConfig {
    baseSeconds: number;
    incrementSeconds: number;
}

export interface TimeControl extends ClockConfig {
    label: string;
    category: TimeControlCategory;
}

export const CUSTOM_MINUTES_MIN: number = 1;
export const CUSTOM_MINUTES_MAX: number = 180;
export const CUSTOM_INCREMENT_MIN: number = 0;
export const CUSTOM_INCREMENT_MAX: number = 60;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const clampCustomMinutes = (minutes: number): number =>
    clamp(Number.isFinite(minutes) ? Math.round(minutes) : CUSTOM_MINUTES_MIN, CUSTOM_MINUTES_MIN, CUSTOM_MINUTES_MAX);

export const clampCustomIncrement = (increment: number): number =>
    clamp(Number.isFinite(increment) ? Math.round(increment) : CUSTOM_INCREMENT_MIN, CUSTOM_INCREMENT_MIN, CUSTOM_INCREMENT_MAX);

export const TIME_CONTROL_PRESETS: ReadonlyArray<TimeControl> = [
    { label: "1 min", category: "bullet", baseSeconds: 60, incrementSeconds: 0 },
    { label: "1 | 1", category: "bullet", baseSeconds: 60, incrementSeconds: 1 },
    { label: "3 min", category: "blitz", baseSeconds: 180, incrementSeconds: 0 },
    { label: "3 | 2", category: "blitz", baseSeconds: 180, incrementSeconds: 2 },
    { label: "5 min", category: "blitz", baseSeconds: 300, incrementSeconds: 0 },
    { label: "5 | 3", category: "blitz", baseSeconds: 300, incrementSeconds: 3 },
    { label: "10 min", category: "rapid", baseSeconds: 600, incrementSeconds: 0 },
    { label: "15 | 10", category: "rapid", baseSeconds: 900, incrementSeconds: 10 },
    { label: "30 min", category: "rapid", baseSeconds: 1800, incrementSeconds: 0 },
];

export const TIME_CONTROL_CATEGORY_LABELS: Record<TimeControlCategory, string> = {
    bullet: "Bullet",
    blitz: "Blitz",
    rapid: "Rapid",
};

export interface TimeControlPreset {
    preset: TimeControl;
    index: number;
}

export interface TimeControlGroup {
    category: TimeControlCategory;
    presets: ReadonlyArray<TimeControlPreset>;
}

const TIME_CONTROL_CATEGORIES: ReadonlyArray<TimeControlCategory> = ["bullet", "blitz", "rapid"];

export const TIME_CONTROL_GROUPS: ReadonlyArray<TimeControlGroup> = TIME_CONTROL_CATEGORIES.map((category) => ({
    category,
    presets: TIME_CONTROL_PRESETS
        .map((preset, index) => ({ preset, index }))
        .filter((entry) => entry.preset.category === category),
}));

export const formatClock = (ms: number): string => {
    const clamped: number = Math.max(0, ms);

    if (clamped < 10_000) {
        const totalTenths: number = Math.floor(clamped / 100);
        const seconds: number = Math.floor(totalTenths / 10);
        const tenths: number = totalTenths % 10;
        return `0:0${seconds}.${tenths}`;
    }

    const totalSeconds: number = Math.floor(clamped / 1000);
    const minutes: number = Math.floor(totalSeconds / 60);
    const seconds: number = totalSeconds % 60;
    const hours: number = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
};
