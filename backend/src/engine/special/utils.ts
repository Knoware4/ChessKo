import { Color } from "chess.js";


export function getOpponent(color: Color): Color {
    return color === "w" ? "b" : "w";
}
