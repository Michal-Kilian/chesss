import { GameState } from "../game-state";
import { Position } from "../position";
import { isPromotionMove, PROMOTION_PIECE_TYPES } from "../promotion";
import { Color } from "../types";
import { Bot, BotMove } from "./bot";

const randomItem = <T>(items: ReadonlyArray<T>): T => items[Math.floor(Math.random() * items.length)];

export class RookieBot extends Bot {
    readonly name: string = "Rookie";

    chooseMove(game: GameState, color: Color): BotMove | null {
        const candidates: Array<BotMove> = [];

        for (const piece of game.pieces.values()) {
            if (piece.color !== color) continue;

            for (const toKey of game.legalMovesFor(piece)) {
                const to = Position.fromAlgebraic(toKey);

                if (isPromotionMove(piece, to)) {
                    for (const promotion of PROMOTION_PIECE_TYPES) {
                        candidates.push({ from: piece.position, to, promotion });
                    }
                } else {
                    candidates.push({ from: piece.position, to });
                }
            }
        }

        return candidates.length > 0 ? randomItem(candidates) : null;
    }

    respondToDrawOffer(): boolean {
        return Math.random() < 0.5;
    }
}
