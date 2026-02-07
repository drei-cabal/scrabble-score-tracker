'use client'

import { useState } from 'react'
import { LETTER_VALUES } from '@/lib/scoring'

interface EndGameFormProps {
    roomCode: string
    playerId: string
    playerName: string
    onFinalized: () => void
}

export default function EndGameForm({ roomCode, playerId, playerName, onFinalized }: EndGameFormProps) {
    const [tiles, setTiles] = useState('')
    const [loading, setLoading] = useState(false)

    // Calculate deduction
    const deduction = tiles
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .split('')
        .reduce((sum, char) => sum + (LETTER_VALUES[char] || 0), 0)

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/moves/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomCode,
                    playerId,
                    tiles: tiles.toUpperCase(),
                    deduction
                })
            })

            if (!res.ok) throw new Error('Failed to submit')

            onFinalized()
            setTiles('')
        } catch (err) {
            console.error(err)
            alert('Failed to submit penalty')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="card p-6 space-y-6 border-2 border-red-500/30">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-2">Game Over!</h2>
                <p className="text-xl font-bold text-primary mb-2">Hello, {playerName}</p>
                <p className="text-text-muted">Enter your remaining tiles to finalize your score.</p>
            </div>

            <div className="bg-black/20 p-4 rounded-lg">
                <label className="block text-sm font-bold mb-2">Remaining Tiles</label>
                <input
                    type="text"
                    value={tiles}
                    onChange={(e) => setTiles(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    placeholder="e.g. AEIOU"
                    className="input-field text-xl tracking-widest uppercase mb-4"
                    disabled={loading}
                />

                <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Total Penalty:</span>
                    <span className="text-xl font-bold text-red-400">-{deduction} pts</span>
                </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-xs text-yellow-200">
                ⚠️ Be honest! These points will be subtracted from your total score.
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full btn-primary bg-red-600 hover:bg-red-700 py-3 font-bold"
            >
                {loading ? 'Submitting...' : 'CONFIRM & FINISH'}
            </button>
        </div>
    )
}
