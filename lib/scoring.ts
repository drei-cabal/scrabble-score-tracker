export const LETTER_VALUES: Record<string, number> = {
    A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
    D: 2, G: 2,
    B: 3, C: 3, M: 3, P: 3,
    F: 4, H: 4, V: 4, W: 4, Y: 4,
    K: 5,
    J: 8, X: 8,
    Q: 10, Z: 10,
    BLANK: 0,
}

export type LetterMultiplier = '1L' | '2L' | '3L'

export interface TileData {
    id: string
    char: string
    value: number
    multiplier: LetterMultiplier
    isBlank: boolean
}

export interface TurnWord {
    id: string
    word: string
    points: number
    tiles: TileData[] // Storing tile config for reference/debugging
}

export const calculateWordScore = (tiles: TileData[], wordMultipliers: string[]): number => {
    let sum = 0

    // 1. Calculate sum of letter values with letter multipliers
    for (const tile of tiles) {
        let tileValue = tile.value
        if (tile.isBlank) {
            tileValue = 0 // Explicitly 0
        }

        if (tile.multiplier === '2L') {
            sum += tileValue * 2
        } else if (tile.multiplier === '3L') {
            sum += tileValue * 3
        } else {
            sum += tileValue
        }
    }

    // 2. Apply word multipliers
    // Assuming word multipliers stack multiplicatively (e.g., DW + TW = x2 * x3 = x6)
    // Or Scrabble rules: "If a word crosses two double-word squares, the count is quadrupled."
    // So yes, they multiply the total.
    for (const mult of wordMultipliers) {
        if (mult === '2W') sum *= 2
        if (mult === '3W') sum *= 3
    }

    // 3. Bingo Bonus
    // Rule: "If a word length is exactly 7 letters..."
    if (tiles.length === 7) {
        sum += 50
    }

    return sum
}
