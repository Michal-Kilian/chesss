import { GameState } from "../game-state";
import { Position } from "../position";
import { Color, PromotionPieceType } from "../types";

export interface BotMove {
    from: Position;
    to: Position;
    promotion?: PromotionPieceType;
}

export abstract class Bot {
    abstract readonly name: string;

    abstract chooseMove(game: GameState, color: Color): BotMove | null;

    abstract respondToDrawOffer(game: GameState, color: Color): boolean;
}
