'use client'

import { Player } from '@/lib/supabase'
import ShareButton from './ShareButton'

interface LobbyViewProps {
    roomCode: string
    players: Player[]
    isHost: boolean
    onStartGame: () => void
    gameMode: 'multi-device' | 'single-device'
    isStarting?: boolean
}

export default function LobbyView({ roomCode, players, isHost, onStartGame, gameMode, isStarting = false }: LobbyViewProps) {
    // Sort players by join order (created_at)
    const sortedPlayers = [...players].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const canStart = players.length >= 2

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card max-w-2xl w-full p-6 md:p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Game Lobby</h1>
                    <div className="inline-flex items-center gap-4 bg-secondary px-6 py-3 rounded-lg mx-auto">
                        <div className="text-left">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Room Code</p>
                            <p className="text-3xl font-bold tracking-widest">{roomCode}</p>
                        </div>
                        <div className="h-10 w-px bg-white/10"></div>
                        <ShareButton roomCode={roomCode} variant="icon" />
                    </div>
                    <p className="text-sm text-text-muted mt-4">
                        {gameMode === 'single-device' ? '📱 Single-Device Mode' : '🌐 Multi-Device Mode'}
                    </p>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Players ({players.length}/4)</h2>
                    <div className="space-y-3">
                        {sortedPlayers.map((player, index) => (
                            <div
                                key={player.id}
                                className="bg-secondary p-4 rounded-lg flex items-center gap-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-xl font-bold">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">{player.name}</p>
                                    {index === 0 && (
                                        <p className="text-xs text-primary">Host</p>
                                    )}
                                </div>
                                <div className="text-sm text-text-muted">
                                    {player.role === 'spectator' ? 'Spectator' : 'Player'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {players.length < 2 && (
                    <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
                        <p className="text-yellow-200 text-sm text-center">
                            Waiting for at least 2 players to start the game...
                        </p>
                    </div>
                )}

                {gameMode === 'multi-device' && (
                    <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
                        <p className="text-blue-200 text-sm text-center">
                            Share the room code with other players to join
                        </p>
                    </div>
                )}

                {isHost && (
                    <button
                        onClick={onStartGame}
                        disabled={!canStart || isStarting}
                        className="btn-primary w-full py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isStarting && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                        {isStarting ? 'Starting Game...' : (canStart ? 'Start Game' : 'Need at least 2 players')}
                    </button>
                )}

                {!isHost && (
                    <div className="text-center text-text-muted">
                        Waiting for host to start the game...
                    </div>
                )}
            </div>
        </div>
    )
}
