'use client'

import { useState, useEffect } from 'react'
import { LETTER_VALUES, TileData, calculateWordScore } from '@/lib/scoring'
import { v4 as uuidv4 } from 'uuid'

interface WordBuilderProps {
    onAddWord: (word: string, points: number, tiles: TileData[]) => void
    disabled?: boolean
}

export default function WordBuilder({ onAddWord, disabled }: WordBuilderProps) {
    const [inputText, setInputText] = useState('')
    const [tiles, setTiles] = useState<TileData[]>([])
    const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)
    const [wordMultipliers, setWordMultipliers] = useState<string[]>([])

    // Update tiles when text changes
    useEffect(() => {
        const chars = inputText.trim().toUpperCase().split('')

        // Preserve existing tile config if length matches or text is similar
        // For simplicity, we regenerate, but try to keep index-based config if we just appended
        // Actually, easiest is: map new chars. If index exists in old tiles & char matches, keep config.

        const newTiles: TileData[] = chars.map((char, index) => {
            const existing = tiles[index]
            if (existing && existing.char === char) {
                return existing
            }
            return {
                id: uuidv4(),
                char,
                value: LETTER_VALUES[char] || 0,
                multiplier: '1L',
                isBlank: false
            }
        })

        setTiles(newTiles)
    }, [inputText])

    const handleTileClick = (index: number) => {
        if (selectedTileIndex === index) {
            setSelectedTileIndex(null) // Deselect
        } else {
            setSelectedTileIndex(index)
        }
    }

    const updateTile = (index: number, updates: Partial<TileData>) => {
        const newTiles = [...tiles]
        newTiles[index] = { ...newTiles[index], ...updates }

        // Update value if blank toggled
        if (updates.isBlank !== undefined) {
            // If blank, value 0. Else reset to LETTER_VALUES
            newTiles[index].value = updates.isBlank
                ? 0
                : (LETTER_VALUES[newTiles[index].char] || 0)
        }

        setTiles(newTiles)
    }

    const toggleWordMultiplier = (mult: '2W' | '3W') => {
        setWordMultipliers(prev => {
            if (prev.includes(mult)) return prev.filter(m => m !== mult)
            return [...prev, mult]
        })
    }

    const handleAdd = () => {
        if (!inputText.trim()) return
        const score = calculateWordScore(tiles, wordMultipliers)
        onAddWord(inputText.trim().toUpperCase(), score, tiles)

        // Reset
        setInputText('')
        setWordMultipliers([])
        setSelectedTileIndex(null)
    }

    const currentScore = calculateWordScore(tiles, wordMultipliers)

    return (
        <div className="space-y-4">
            {/* Input */}
            <div>
                <label className="block text-sm font-medium mb-1">Construct Word</label>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    placeholder="TYPE HERE..."
                    className="input-field uppercase text-lg tracking-widest font-bold"
                    disabled={disabled}
                />
            </div>

            {/* Tile Grid */}
            {tiles.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center py-2 bg-black/20 rounded-lg p-2 min-h-[60px]">
                    {tiles.map((tile, index) => (
                        <div
                            key={tile.id}
                            onClick={() => !disabled && handleTileClick(index)}
                            className={`
                                relative w-12 h-12 flex items-center justify-center rounded-md cursor-pointer transition-all border-b-4 select-none
                                ${selectedTileIndex === index
                                    ? 'bg-yellow-100 border-yellow-300 ring-2 ring-primary -translate-y-1'
                                    : 'bg-[#E8D0B3] border-[#C1A88B] hover:-translate-y-0.5'
                                }
                            `}
                        >
                            <span className="text-2xl font-bold text-[#4A3F35]">
                                {tile.char}
                            </span>
                            <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-[#4A3F35]">
                                {tile.value}
                            </span>

                            {/* Badges */}
                            {tile.isBlank && (
                                <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-[8px] px-1 rounded-full">
                                    BLK
                                </div>
                            )}
                            {tile.multiplier === '2L' && (
                                <div className="absolute -top-2 -left-2 bg-blue-400 text-white text-[8px] px-1 rounded-full shadow-sm">
                                    DL
                                </div>
                            )}
                            {tile.multiplier === '3L' && (
                                <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[8px] px-1 rounded-full shadow-sm">
                                    TL
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Tile Controls (Contextual) */}
            {selectedTileIndex !== null && tiles[selectedTileIndex] && (
                <div className="bg-secondary p-3 rounded-lg animate-in grid grid-cols-3 gap-2">
                    <button
                        onClick={() => updateTile(selectedTileIndex, {
                            multiplier: tiles[selectedTileIndex].multiplier === '1L' ? '2L' : '1L'
                        })}
                        className={`p-2 rounded text-xs font-bold transition-all ${tiles[selectedTileIndex].multiplier === '2L'
                                ? 'bg-blue-400 text-white shadow-inner'
                                : 'bg-card hover:bg-opacity-80'
                            }`}
                    >
                        DOUBLE LETTER
                    </button>
                    <button
                        onClick={() => updateTile(selectedTileIndex, {
                            multiplier: tiles[selectedTileIndex].multiplier === '1L' ? '3L' : '1L'
                        })}
                        className={`p-2 rounded text-xs font-bold transition-all ${tiles[selectedTileIndex].multiplier === '3L'
                                ? 'bg-blue-600 text-white shadow-inner'
                                : 'bg-card hover:bg-opacity-80'
                            }`}
                    >
                        TRIPLE LETTER
                    </button>
                    <button
                        onClick={() => updateTile(selectedTileIndex, {
                            isBlank: !tiles[selectedTileIndex].isBlank
                        })}
                        className={`p-2 rounded text-xs font-bold transition-all ${tiles[selectedTileIndex].isBlank
                                ? 'bg-gray-500 text-white shadow-inner'
                                : 'bg-[#E8D0B3] text-[#4A3F35] hover:opacity-80'
                            }`}
                    >
                        BLANK TILE
                    </button>
                </div>
            )}

            {/* Global Controls */}
            {tiles.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => toggleWordMultiplier('2W')}
                        className={`p-3 rounded-lg font-bold text-sm transition-all border-2 ${wordMultipliers.includes('2W')
                                ? 'bg-red-300 border-red-500 text-red-900 shadow-inner'
                                : 'bg-card border-transparent hover:bg-red-500/10 text-red-300'
                            }`}
                    >
                        DOUBLE WORD
                    </button>
                    <button
                        onClick={() => toggleWordMultiplier('3W')}
                        className={`p-3 rounded-lg font-bold text-sm transition-all border-2 ${wordMultipliers.includes('3W')
                                ? 'bg-red-500 border-red-700 text-white shadow-inner'
                                : 'bg-card border-transparent hover:bg-red-500/10 text-red-500'
                            }`}
                    >
                        TRIPLE WORD
                    </button>
                </div>
            )}

            {/* Score Preview & Add */}
            {tiles.length > 0 && (
                <div className="flex items-center gap-4 pt-2">
                    <div className="bg-card px-4 py-2 rounded-lg flex-1 text-center">
                        <span className="text-text-muted text-xs uppercase block">Score</span>
                        <span className="text-2xl font-bold text-primary">{currentScore}</span>
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={disabled || !inputText}
                        className="flex-[2] btn-primary py-3 font-bold flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        ADD TO TURN
                    </button>
                </div>
            )}
        </div>
    )
}
