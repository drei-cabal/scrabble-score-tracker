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

export const INITIAL_TILE_DISTRIBUTION: Record<string, number> = {
    A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1, BLANK: 2
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


    return sum
}

export const subtractFromBag = (bag: Record<string, number>, tiles: TileData[]): Record<string, number> => {
    const newBag = { ...bag }
    for (const tile of tiles) {
        const key = tile.isBlank ? 'BLANK' : tile.char.toUpperCase()
        if (newBag[key] !== undefined) {
            newBag[key] = Math.max(0, newBag[key] - 1)
        }
    }
    return newBag
}

export const addToBag = (bag: Record<string, number>, tiles: TileData[]): Record<string, number> => {
    const newBag = { ...bag }
    for (const tile of tiles) {
        const key = tile.isBlank ? 'BLANK' : tile.char.toUpperCase()
        if (newBag[key] !== undefined) {
            newBag[key] = newBag[key] + 1
        }
    }
    return newBag
}
