'use client'

import { useState, useEffect } from 'react'
import WordBuilder from './WordBuilder'
import ConfirmationModal from './ConfirmationModal'
import { TileData } from '@/lib/scoring'
import { v4 as uuidv4 } from 'uuid'
import { offlineQueue } from '@/lib/offlineQueue'

interface SubmitWordFormProps {
    roomCode: string
    playerId: string
    hostId?: string
    isMyTurn: boolean
    isSpectator: boolean
    isHost?: boolean
    onConfirmationRequest?: (config: ConfirmationConfig) => void
}

export interface ConfirmationConfig {
    isOpen: boolean
    title: string
    message: string
    action: () => Promise<void>
    buttonText: string
    isDanger: boolean
}

interface TurnWord {
    id: string
    word: string
    points: number
    tiles: TileData[]
}

export default function SubmitWordForm({
    roomCode,
    playerId,
    hostId,
    isMyTurn,
    isSpectator,
    isHost = false,
    onConfirmationRequest
}: SubmitWordFormProps) {
    const [turnWords, setTurnWords] = useState<TurnWord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean
        title: string
        message: string
        action: () => Promise<void>
        buttonText: string
        isDanger: boolean
    }>({
        isOpen: false,
        title: '',
        message: '',
        action: async () => { },
        buttonText: '',
        isDanger: false
    })

    const [isOffline, setIsOffline] = useState(false)

    useEffect(() => {
        setIsOffline(!navigator.onLine)
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const turnTotal = turnWords.reduce((sum, w) => sum + w.points, 0)

    const handleAddWord = (word: string, points: number, tiles: TileData[]) => {
        setTurnWords([...turnWords, { id: uuidv4(), word, points, tiles }])
        setError('')
    }

    const removeWord = (id: string) => {
        setTurnWords(turnWords.filter(w => w.id !== id))
    }

    const handleSubmitTurn = async () => {
        if (turnWords.length === 0) {
            setError('Add at least one word to end your turn')
            return
        }

        setLoading(true)
        setError('')
        setSuccess('')

        // Concatenate words for display
        const wordDisplay = turnWords.map(w => w.word).join(', ')
        const payload = {
            roomCode,
            playerId,
            word: wordDisplay,
            points: turnTotal,
            details: turnWords
        }

        if (!navigator.onLine) {
            // Offline Mode: Queue the move
            offlineQueue.add('submit', payload)
            setTurnWords([])
            setSuccess('Offline: Move queued. It will sync when you reconnect.')
            setLoading(false)
            // Note: Game state won't update until sync, so turn won't advance visually
            // Ideally wed have optimistic local state update here
            return
        }

        try {
            const response = await fetch('/api/moves/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit turn')
            }

            setTurnWords([])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const executeUndo = async () => {
        setLoading(true)
        setError('')
        setSuccess('')
        setConfirmation(prev => ({ ...prev, isOpen: false }))

        try {
            const response = await fetch('/api/moves/undo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomCode,
                    playerId: hostId || playerId
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to undo')
            }

            // Dispatch custom event to trigger moves refresh
            window.dispatchEvent(new CustomEvent('moves-updated'))

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUndoClick = () => {
        setConfirmation({
            isOpen: true,
            title: 'Undo Last Turn?',
            message: 'Are you sure you want to UNDO the last turn? This will revert points and turn order.',
            action: executeUndo,
            buttonText: 'Undo Turn',
            isDanger: true
        })
    }

    const executeSkip = async () => {
        setLoading(true)
        setError('')
        setConfirmation(prev => ({ ...prev, isOpen: false }))

        try {
            const response = await fetch('/api/moves/skip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, playerId }),
            })

            if (!response.ok) throw new Error('Failed to skip')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSkipClick = () => {
        setConfirmation({
            isOpen: true,
            title: 'Skip Turn?',
            message: 'Are you sure you want to skip your turn? You will perform no action and score 0 points.',
            action: executeSkip,
            buttonText: 'Skip Turn',
            isDanger: false
        })
    }

    const executeSwap = async () => {
        setLoading(true)
        setConfirmation(prev => ({ ...prev, isOpen: false }))
        try {
            const response = await fetch('/api/moves/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, playerId }),
            })
            if (!response.ok) throw new Error('Failed to swap')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSwapClick = () => {
        setConfirmation({
            isOpen: true,
            title: 'Swap Tiles?',
            message: 'Are you sure you want to swap your tiles? This counts as your turn and you score 0 points.',
            action: executeSwap,
            buttonText: 'Swap Tiles',
            isDanger: false
        })
    }

    const isDisabled = !isMyTurn || isSpectator || loading

    return (
        <div className="card p-3 md:p-6 space-y-6 transition-all duration-300 ease-in-out">
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                title={confirmation.title}
                message={confirmation.message}
                onConfirm={confirmation.action}
                onCancel={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                confirmText={confirmation.buttonText}
                isDanger={confirmation.isDanger}
            />

            <h2 className="text-lg md:text-xl font-bold">Construct Your Turn</h2>

            {/* Notifications */}
            {isSpectator && (
                <div className="p-3 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-200 text-sm transition-all duration-200">
                    Spectator Mode: You can watch the game.
                </div>
            )}
            {!isMyTurn && !isSpectator && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-200 text-sm transition-all duration-200">
                    Waiting for your turn...
                </div>
            )}
            {isOffline && (
                <div className="p-3 bg-orange-500/20 border border-orange-500 rounded-lg text-orange-200 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 011.414 0" /></svg>
                    You are offline. Moves will be queued.
                </div>
            )}
            {error && <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm transition-all duration-200">{error}</div>}
            {success && <div className="p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-sm transition-all duration-200">{success}</div>}

            {/* Word Builder */}
            {!isSpectator && isMyTurn && (
                <div className="transition-all duration-300 ease-in-out">
                    <WordBuilder onAddWord={handleAddWord} disabled={isDisabled} />
                </div>
            )}

            {/* Turn Buffer */}
            {turnWords.length > 0 && (
                <div className="bg-secondary rounded-lg p-4">
                    <h3 className="text-sm font-semibold mb-3 text-text-muted uppercase">Current Turn</h3>
                    <div className="space-y-2 mb-4">
                        {turnWords.map((word) => (
                            <div key={word.id} className="flex items-center justify-between bg-black/20 p-2 rounded">
                                <span className="font-bold tracking-wider">{word.word}</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-primary">{word.points} pts</span>
                                    <button
                                        onClick={() => removeWord(word.id)}
                                        className="text-red-400 hover:text-red-300"
                                        title="Remove word"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3 mb-4">
                        <span className="font-bold">Total Score</span>
                        <span className="text-xl font-bold text-green-400">{turnTotal} pts</span>
                    </div>

                    <button
                        onClick={handleSubmitTurn}
                        disabled={loading}
                        className="w-full btn-primary py-3 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        {loading ? 'Submitting...' : 'END TURN'}
                    </button>
                </div>
            )}

            {/* Secondary Actions (Only clear if buffer empty, or distinct area) */}
            {turnWords.length === 0 && !isSpectator && isMyTurn && (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleSkipClick}
                        disabled={isDisabled}
                        className="btn-secondary py-3 text-sm"
                    >
                        Skip Turn
                    </button>
                    <button
                        onClick={handleSwapClick}
                        disabled={isDisabled}
                        className="btn-secondary py-3 text-sm"
                    >
                        Swap Tiles
                    </button>
                </div>
            )}

            {/* Host Actions */}
            {isHost && (
                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={handleUndoClick}
                        disabled={loading}
                        className="w-full py-2 bg-red-900/40 text-red-200 border border-red-900/50 rounded-lg hover:bg-red-900/60 transition-all text-xs uppercase font-bold tracking-wider"
                    >
                        Undo Last Move (Host Only)
                    </button>
                </div>
            )}
        </div>
    )
}
