import { GameStatus } from "./types";

export const describeGameStatus = (status: GameStatus): string => {
    switch (status.status) {
        case "checkmate":
            return `Checkmate - ${status.winner === "white" ? "White" : "Black"} wins`;
        case "resignation":
            return `${status.winner === "white" ? "Black" : "White"} resigned - ${status.winner === "white" ? "White" : "Black"} wins`;
        case "timeout":
            return `${status.winner === "white" ? "Black" : "White"} ran out of time - ${status.winner === "white" ? "White" : "Black"} wins`;
        case "stalemate":
            return "Stalemate - draw";
        case "draw":
            switch (status.reason) {
                case "fifty-move":
                    return "Draw - fifty-move rule";
                case "threefold-repetition":
                    return "Draw - threefold repetition";
                case "insufficient-material":
                    return "Draw - insufficient material";
                case "agreement":
                    return "Draw - by agreement";
            }
        default:
            return "";
    }
};
