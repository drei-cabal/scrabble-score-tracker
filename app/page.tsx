'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AboutModal from '@/components/AboutModal'
import HowToUseModal from '@/components/HowToUseModal'

export default function Home() {
    const [activeTab, setActiveTab] = useState<'join' | 'create'>('join')
    const [roomCode, setRoomCode] = useState('')
    const [playerName, setPlayerName] = useState('')
    const [joinAsSpectator, setJoinAsSpectator] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showAbout, setShowAbout] = useState(false)
    const [showHowToUse, setShowHowToUse] = useState(false)
    const router = useRouter()

    const handleCreateRoom = async () => {
        if (!playerName.trim()) {
            setError('Please enter your name')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: playerName.trim() }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create room')
            }

            // Save session to localStorage
            localStorage.setItem('scrabble_session', JSON.stringify({
                playerId: data.playerId,
                roomCode: data.roomCode,
                playerName: playerName.trim(),
            }))

            // Navigate to game room
            router.push(`/game/${data.roomCode}`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinRoom = async () => {
        if (!playerName.trim()) {
            setError('Please enter your name')
            return
        }

        if (!roomCode.trim() || roomCode.trim().length !== 4) {
            setError('Please enter a valid 4-character room code')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/rooms/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomCode: roomCode.trim().toUpperCase(),
                    playerName: playerName.trim(),
                    forceSpectator: joinAsSpectator,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join room')
            }

            // Save session to localStorage
            localStorage.setItem('scrabble_session', JSON.stringify({
                playerId: data.playerId,
                roomCode: roomCode.trim().toUpperCase(),
                playerName: playerName.trim(),
            }))

            // Navigate to game room
            router.push(`/game/${roomCode.trim().toUpperCase()}`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md mx-auto">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-4">
                        <svg
                            className="w-16 h-16 text-primary"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm13 0h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v3h-3v-3z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold mb-2">SCRABBLE</h1>
                    <p className="text-text-muted">Competition Dashboard</p>

                    {/* Text Links */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <button
                            onClick={() => setShowAbout(true)}
                            className="text-sm text-white/60 hover:text-primary transition-colors underline-offset-4 hover:underline cursor-pointer"
                        >
                            About
                        </button>
                        <span className="text-white/30">•</span>
                        <button
                            onClick={() => setShowHowToUse(true)}
                            className="text-sm text-white/60 hover:text-primary transition-colors underline-offset-4 hover:underline cursor-pointer"
                        >
                            How To Use
                        </button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => {
                            setActiveTab('join')
                            setError('')
                        }}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'join'
                            ? 'bg-gradient-primary text-white shadow-lg'
                            : 'bg-secondary text-text-muted hover:bg-opacity-80'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Join
                        </span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('create')
                            setError('')
                        }}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${activeTab === 'create'
                            ? 'bg-gradient-primary text-white shadow-lg'
                            : 'bg-secondary text-text-muted hover:bg-opacity-80'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create
                        </span>
                    </button>
                </div>

                {/* Content Card */}
                <div className="card p-6 sm:p-8">
                    {activeTab === 'join' ? (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Room Code</label>
                                <input
                                    type="text"
                                    placeholder="E.G., ABC123"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    maxLength={4}
                                    className="input-field uppercase"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Alex"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center gap-3 bg-secondary p-4 rounded-lg cursor-pointer hover:bg-opacity-80 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={joinAsSpectator}
                                        onChange={(e) => setJoinAsSpectator(e.target.checked)}
                                        className="w-5 h-5 accent-primary"
                                    />
                                    <span className="text-sm">Join as Spectator</span>
                                </label>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleJoinRoom}
                                disabled={loading}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Joining...' : 'Join Game'}
                            </button>

                            <p className="text-text-muted text-sm text-center mt-4">
                                Ask your host for the room code to join an active game.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Alex"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    className="input-field"
                                />
                            </div>

                            <div className="mb-6 bg-secondary p-4 rounded-lg">
                                <p className="text-sm font-medium mb-1">Room Code will be generated:</p>
                                <p className="text-text-muted text-sm">
                                    You'll receive a unique room code to share with other players.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleCreateRoom}
                                disabled={loading}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Room'}
                            </button>

                            <p className="text-text-muted text-sm text-center mt-4">
                                You'll be the host. Share the room code with players.
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
            <HowToUseModal isOpen={showHowToUse} onClose={() => setShowHowToUse(false)} />
        </div>
    )
}
