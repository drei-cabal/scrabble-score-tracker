'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AboutModal from '@/components/modals/AboutModal'
import HowToUseModal from '@/components/modals/HowToUseModal'

export default function HomeDashboard() {
    const [activeTab, setActiveTab] = useState<'join' | 'create' | 'reconnect'>('create')
    const [roomCode, setRoomCode] = useState('')
    const [reconnectCode, setReconnectCode] = useState('')
    const [playerName, setPlayerName] = useState('')
    const [joinAsSpectator, setJoinAsSpectator] = useState(false)

    // Game mode and timer settings
    const [gameMode, setGameMode] = useState<'multi-device' | 'single-device'>('multi-device')
    const [turnTimerEnabled, setTurnTimerEnabled] = useState(false)
    const [turnTimerSeconds, setTurnTimerSeconds] = useState(60)
    const [playerNames, setPlayerNames] = useState(['', ''])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showAbout, setShowAbout] = useState(false)
    const [showHowToUse, setShowHowToUse] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Handle URL code parameter (for shared links)
    useEffect(() => {
        const code = searchParams.get('code')
        if (code) {
            setRoomCode(code.toUpperCase())
            setActiveTab('join')
            // Clean URL without reload
            window.history.replaceState({}, '', '/')
        }
    }, [searchParams])



    const handleReconnectToRoom = async () => {
        const trimmedCode = reconnectCode.trim().toUpperCase()

        if (!trimmedCode) {
            setError('Please enter a room code')
            return
        }

        if (trimmedCode.length !== 5) {
            setError('Room code must be 5 characters')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Just navigate directly to the game page
            // The game page will handle auto-recovery for single-device rooms
            router.push(`/game/${trimmedCode}`)
        } catch (err: any) {
            setError(err.message || 'Failed to reconnect')
            setLoading(false)
        }
    }

    const handleCreateRoom = async () => {
        // Validation based on game mode
        if (gameMode === 'single-device') {
            // Validate player names
            const validNames = playerNames.filter(name => name.trim())
            if (validNames.length < 2) {
                setError('Please enter at least 2 player names for single-device mode')
                return
            }
            // Check for duplicate names
            const uniqueNames = new Set(validNames.map(n => n.trim().toLowerCase()))
            if (uniqueNames.size !== validNames.length) {
                setError('Player names must be unique')
                return
            }
        } else {
            // Multi-device mode
            if (!playerName.trim()) {
                setError('Please enter your name')
                return
            }
        }

        // Validate timer settings
        if (turnTimerEnabled && (turnTimerSeconds < 10 || turnTimerSeconds > 300)) {
            setError('Timer must be between 10 and 300 seconds')
            return
        }

        setLoading(true)
        setError('')

        try {
            const requestBody: any = {
                gameMode,
                turnTimerEnabled,
                turnTimerSeconds,
            }

            if (gameMode === 'single-device') {
                requestBody.playerNames = playerNames.filter(name => name.trim())
            } else {
                requestBody.playerName = playerName.trim()
            }

            const response = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create room')
            }

            // Save session to localStorage
            const session: any = {
                roomCode: data.roomCode,
                gameMode: data.gameMode,
            }

            if (gameMode === 'single-device') {
                session.playerIds = data.playerIds
                session.hostPlayerId = data.hostPlayerId
                session.isSingleDevice = true
            } else {
                session.playerId = data.playerId
                session.playerName = playerName.trim()
            }

            localStorage.setItem('scrabble_session', JSON.stringify(session))

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

        if (!roomCode.trim() || roomCode.trim().length !== 5) {
            setError('Please enter a valid 5-character room code')
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
            const sessionData: any = {
                playerId: data.playerId,
                roomCode: roomCode.trim().toUpperCase(),
                playerName: playerName.trim(),
            }

            if (data.isSingleDevice) {
                sessionData.isSingleDevice = true
                sessionData.hostPlayerId = data.hostPlayerId
                sessionData.gameMode = 'single-device'
            }

            localStorage.setItem('scrabble_session', JSON.stringify(sessionData))

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
                <div className="text-center mb-4 sm:mb-8">
                    <div className="inline-block mb-2 sm:mb-4">
                        <svg
                            className="w-12 h-12 sm:w-16 sm:h-16 text-primary"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm13 0h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v3h-3v-3z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">SCRABBLE</h1>
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
                            setActiveTab('create')
                            setError('')
                        }}
                        className={`flex-1 py-2 sm:py-3 px-1 sm:px-6 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${activeTab === 'create'
                            ? 'bg-gradient-primary text-white shadow-lg'
                            : 'bg-secondary text-text-muted hover:bg-opacity-80'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-1 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create
                        </span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('join')
                            setError('')
                        }}
                        className={`flex-1 py-2 sm:py-3 px-1 sm:px-6 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${activeTab === 'join'
                            ? 'bg-gradient-primary text-white shadow-lg'
                            : 'bg-secondary text-text-muted hover:bg-opacity-80'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-1 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Join
                        </span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('reconnect')
                            setError('')
                        }}
                        className={`flex-1 py-2 sm:py-3 px-1 sm:px-6 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${activeTab === 'reconnect'
                            ? 'bg-gradient-primary text-white shadow-lg'
                            : 'bg-secondary text-text-muted hover:bg-opacity-80'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-1 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Reconnect
                        </span>
                    </button>
                </div>


                {/* Content Card */}
                <div className="card p-4 sm:p-6 md:p-8">
                    {activeTab === 'join' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Room Code</label>
                                <input
                                    type="text"
                                    placeholder="E.G., ABCDE"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    maxLength={5}
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
                    )}

                    {activeTab === 'reconnect' && (
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Room Code</label>
                                <input
                                    type="text"
                                    placeholder="E.G., ABCDE"
                                    value={reconnectCode}
                                    onChange={(e) => setReconnectCode(e.target.value.toUpperCase())}
                                    maxLength={5}
                                    className="input-field uppercase text-center text-2xl tracking-widest font-mono"
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleReconnectToRoom}
                                disabled={loading}
                                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Reconnecting...' : 'Reconnect to Game'}
                            </button>

                            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm text-blue-200">
                                        <p className="font-semibold mb-1">Device Switch Recovery</p>
                                        <p className="text-blue-300/80">
                                            Use this to rejoin a Single-Device game from a different device.
                                            Just enter the 5-character room code and you'll be back in the game!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'create' && (
                        <>
                            {/* Game Mode Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-3">Game Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setGameMode('multi-device')}
                                        className={`p-4 rounded-lg border-2 transition-all ${gameMode === 'multi-device'
                                            ? 'border-primary bg-primary/20'
                                            : 'border-secondary bg-secondary hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">🌐</div>
                                        <div className="font-semibold text-sm">Multi-Device</div>
                                        <div className="text-xs text-text-muted mt-1">Each player uses their own device</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGameMode('single-device')}
                                        className={`p-4 rounded-lg border-2 transition-all ${gameMode === 'single-device'
                                            ? 'border-primary bg-primary/20'
                                            : 'border-secondary bg-secondary hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">📱</div>
                                        <div className="font-semibold text-sm">Single-Device</div>
                                        <div className="text-xs text-text-muted mt-1">Pass one device between players</div>
                                    </button>
                                </div>
                            </div>

                            {/* Turn Timer Settings */}
                            <div className="mb-6 bg-secondary p-4 rounded-lg">
                                <label className="flex items-center gap-3 cursor-pointer mb-3">
                                    <input
                                        type="checkbox"
                                        checked={turnTimerEnabled}
                                        onChange={(e) => setTurnTimerEnabled(e.target.checked)}
                                        className="w-5 h-5 accent-primary"
                                    />
                                    <span className="text-sm font-medium">Enable Turn Timer</span>
                                </label>

                                {turnTimerEnabled && (
                                    <div>
                                        <label className="block text-sm mb-2">Seconds per Turn</label>
                                        <input
                                            type="number"
                                            min={10}
                                            max={300}
                                            value={turnTimerSeconds}
                                            onChange={(e) => setTurnTimerSeconds(parseInt(e.target.value) || 60)}
                                            className="input-field w-full"
                                        />
                                        <p className="text-xs text-text-muted mt-1">Between 10 and 300 seconds</p>
                                    </div>
                                )}
                            </div>

                            {/* Player Name Input (Multi-Device) or Player Names (Single-Device) */}
                            {gameMode === 'multi-device' ? (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Your Name (Host)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Alex"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">Player Names (2-4 players)</label>
                                    {playerNames.map((name, index) => (
                                        <div key={index} className="mb-2 flex gap-2">
                                            <input
                                                type="text"
                                                placeholder={`Player ${index + 1}`}
                                                value={name}
                                                onChange={(e) => {
                                                    const newNames = [...playerNames]
                                                    newNames[index] = e.target.value
                                                    setPlayerNames(newNames)
                                                }}
                                                className="input-field flex-1"
                                            />
                                            {index >= 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newNames = playerNames.filter((_, i) => i !== index)
                                                        setPlayerNames(newNames)
                                                    }}
                                                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {playerNames.length < 4 && (
                                        <button
                                            type="button"
                                            onClick={() => setPlayerNames([...playerNames, ''])}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            + Add Player
                                        </button>
                                    )}
                                </div>
                            )}

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
                                {gameMode === 'multi-device'
                                    ? "You'll be the host. Share the room code with players."
                                    : "All players will use this device. Pass it between turns."}
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
