import { Color, Value } from "~/lib/types";
import { Position } from "../position";
import { BoardState } from "../board-state";

export abstract class Piece {
    color: Color;
    position: Position;
    name: string;
    notation: string;
    icon: string;
    value: Value;
    hasMoved: boolean = false;

    constructor(
        color: Color,
        position: Position,
        name: string,
        notation: string,
        icon: string,
        value: Value,
    ) {
        this.color = color;
        this.position = position;
        this.name = name;
        this.notation = notation;
        this.icon = icon;
        this.value = value;
    };

    abstract getPseudoLegalMoves(board: BoardState): Array<Position>;

    getAttackedSquares(board: BoardState): Array<Position> {
        return this.getPseudoLegalMoves(board);
    };

    protected canMoveTo(board: BoardState, position: Position): boolean {
        return !board.isOccupiedByColor(position, this.color);
    };
};