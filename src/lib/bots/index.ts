import { Bot } from "./bot";
import { RookieBot } from "./rookie";

export { Bot } from "./bot";
export type { BotMove } from "./bot";

const BOTS_BY_ID: Record<number, Bot> = {
    1: new RookieBot(),
};

export const createBot = (botId: number): Bot | null => BOTS_BY_ID[botId] ?? null;
