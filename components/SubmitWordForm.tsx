'use client'

import { useState } from 'react'

interface SubmitWordFormProps {
    roomCode: string
    playerId: string
    isMyTurn: boolean
    isSpectator: boolean
}

export default function SubmitWordForm({
    roomCode,
    playerId,
    isMyTurn,
    isSpectator,
}: SubmitWordFormProps) {
    const [word, setWord] = useState('')
    const [points, setPoints] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSubmit = async () => {
        if (!word.trim() || !points) {
            setError('Please enter both word and points')
            return
        }

        const pointsNum = parseInt(points)
        if (isNaN(pointsNum) || pointsNum < 0) {
            setError('Points must be a valid number')
            return
        }

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/moves/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomCode,
                    playerId,
                    word: word.trim(),
                    points: pointsNum,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit word')
            }

            setSuccess('Word submitted!')
            setWord('')
            setPoints('')
            setTimeout(() => setSuccess(''), 2000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSkip = async () => {
        if (!confirm('Are you sure you want to skip your turn?')) return

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/moves/skip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, playerId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to skip turn')
            }

            setSuccess('Turn skipped')
            setTimeout(() => setSuccess(''), 2000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSwap = async () => {
        if (!confirm('Are you sure you want to swap tiles?')) return

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/moves/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, playerId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to swap tiles')
            }

            setSuccess('Tiles swapped')
            setTimeout(() => setSuccess(''), 2000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleClear = () => {
        setWord('')
        setPoints('')
        setError('')
        setSuccess('')
    }

    const isDisabled = !isMyTurn || isSpectator || loading

    return (
        <div className="card p-3 md:p-6">
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Submit Your Word</h2>

            {isSpectator && (
                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg text-blue-200 text-xs md:text-sm">
                    You are a spectator. Only players can submit words.
                </div>
            )}

            {!isMyTurn && !isSpectator && (
                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg text-yellow-200 text-xs md:text-sm">
                    Wait for your turn to submit a word.
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-4">
                <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">Word</label>
                    <input
                        type="text"
                        placeholder="E.G., TRIPLE"
                        value={word}
                        onChange={(e) => setWord(e.target.value.toUpperCase())}
                        disabled={isDisabled}
                        className="input-field uppercase text-sm md:text-base"
                    />
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">Points</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        disabled={isDisabled}
                        className="input-field text-sm md:text-base"
                        min="0"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200 text-xs md:text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg text-green-200 text-xs md:text-sm">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                <button
                    onClick={handleSubmit}
                    disabled={isDisabled}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base py-2 md:py-3"
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
                <button
                    onClick={handleClear}
                    disabled={loading}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base py-2 md:py-3"
                >
                    Clear
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
                <button
                    onClick={handleSkip}
                    disabled={isDisabled}
                    className="px-2 md:px-4 py-2 bg-secondary rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 md:gap-2 text-xs md:text-base"
                >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Skip
                </button>
                <button
                    onClick={handleSwap}
                    disabled={isDisabled}
                    className="px-2 md:px-4 py-2 bg-secondary rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base"
                >
                    Swap Tiles
                </button>
            </div>
        </div>
    )
}
