'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Room, type Player, type Move } from '@/lib/supabase'
import LiveLeaderboard from '@/components/game/LiveLeaderboard'
import RecentWords from '@/components/game/RecentWords'
import CurrentTurn from '@/components/game/CurrentTurn'
import SubmitWordForm from '@/components/game/SubmitWordForm'
import EndGameForm from '@/components/game/EndGameForm'
import ConfirmationModal from '@/components/modals/ConfirmationModal'
import AboutModal from '@/components/modals/AboutModal'
import HowToUseModal from '@/components/modals/HowToUseModal'
import LobbyView from '@/components/game/LobbyView'
import PassDeviceOverlay from '@/components/ui/PassDeviceOverlay'
import TimerSettingsModal from '@/components/modals/TimerSettingsModal'
import TileBag from '@/components/game/TileBag'
import { offlineQueue } from '@/lib/offlineQueue'
import { INITIAL_TILE_DISTRIBUTION } from '@/lib/scoring'

export default function GamePage() {
    const params = useParams()
    const router = useRouter()
    const roomCode = params.roomCode as string

    const [room, setRoom] = useState<Room | null>(null)
    const [players, setPlayers] = useState<Player[]>([])
    const [moves, setMoves] = useState<Move[]>([])
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
    const [isSingleDevice, setIsSingleDevice] = useState(false)
    const [showPassDevice, setShowPassDevice] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [connectionStatus, setConnectionStatus] = useState('CONNECTING')
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
    const [isEndGameModalOpen, setIsEndGameModalOpen] = useState(false)
    const [showAbout, setShowAbout] = useState(false)
    const [showHowToUse, setShowHowToUse] = useState(false)
    const [showTimerSettings, setShowTimerSettings] = useState(false)
    const [isStarting, setIsStarting] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Define loadGameData with useCallback so it can be used in useEffect
    const loadGameData = useCallback(async (playerId: string) => {
        try {
            // Load room
            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('room_code', roomCode)
                .single()

            if (roomError) throw roomError
            setRoom(roomData)

            // Load players
            const { data: playersData, error: playersError } = await supabase
                .from('players')
                .select('*')
                .eq('room_code', roomCode)
                .order('total_score', { ascending: false })

            if (playersError) throw playersError
            setPlayers(playersData || [])

            // Load moves
            const { data: movesData, error: movesError } = await supabase
                .from('moves')
                .select('*')
                .eq('room_code', roomCode)
                .order('created_at', { ascending: false })
                .limit(20)

            if (movesError) throw movesError
            setMoves(movesData || [])

            setLoading(false)
        } catch (err: any) {
            console.error('Load game data error:', err)
            setError(err.message)
            setLoading(false)
        }
    }, [roomCode])

    // Load session from localStorage OR Recover from URL
    useEffect(() => {
        const initializeGame = async () => {
            const sessionData = localStorage.getItem('scrabble_session')
            let session = sessionData ? JSON.parse(sessionData) : null

            // If session is valid and matches room
            if (session && session.roomCode === roomCode) {
                if (session.isSingleDevice) {
                    setIsSingleDevice(true)
                    setMyPlayerId(session.hostPlayerId)
                } else {
                    setMyPlayerId(session.playerId)
                }
                // Call loadGameData if it's available in scope (handled by effect timing)
                loadGameData(session.playerId || session.hostPlayerId)
                return
            }

            // If no valid session, try to recover SINGLE DEVICE game
            try {
                // Check if room exists and is single-device
                const { data: roomCheck } = await supabase
                    .from('rooms')
                    .select('game_mode')
                    .eq('room_code', roomCode)
                    .single()

                if (roomCheck && roomCheck.game_mode === 'single-device') {
                    console.log('Recovering Single Device Session...')

                    // Fetch host player to impersonate/resume
                    const { data: hostPlayer } = await supabase
                        .from('players')
                        .select('id')
                        .eq('room_code', roomCode)
                        .eq('seat_order', 0)
                        .single()

                    if (hostPlayer) {
                        // Create new session
                        const newSession = {
                            roomCode,
                            gameMode: 'single-device',
                            hostPlayerId: hostPlayer.id,
                            isSingleDevice: true
                        }
                        localStorage.setItem('scrabble_session', JSON.stringify(newSession))

                        setIsSingleDevice(true)
                        setMyPlayerId(hostPlayer.id)
                        loadGameData(hostPlayer.id)
                        return
                    }
                }
            } catch (err) {
                console.error('Recovery attempt failed:', err)
            }

            // If recovery failed, back to home
            router.push('/')
        }

        initializeGame()
    }, [roomCode, router, loadGameData])

    // Offline queue sync
    useEffect(() => {
        const handleOnline = async () => {
            console.log('Online detected, syncing queue...')
            setConnectionStatus('RECONNECTING')
            await offlineQueue.sync()
            setConnectionStatus('SUBSCRIBED')

            // Reload data to reflect synced moves
            const sessionData = localStorage.getItem('scrabble_session')
            if (sessionData) {
                const session = JSON.parse(sessionData)
                loadGameData(session.playerId || session.hostPlayerId)
            }
        }

        window.addEventListener('online', handleOnline)
        return () => window.removeEventListener('online', handleOnline)
    }, [roomCode])

    // Listen for manual move updates (e.g. from Undo)
    useEffect(() => {
        const handleMovesUpdated = () => {
            if (myPlayerId) {
                console.log('Manual moves update triggered')
                loadGameData(myPlayerId)
            }
        }

        window.addEventListener('moves-updated', handleMovesUpdated)
        return () => window.removeEventListener('moves-updated', handleMovesUpdated)
    }, [myPlayerId, roomCode])

    // Check if I have already finalized (for End Game state)
    const [hasFinalized, setHasFinalized] = useState(false)
    const [finalizedPlayerIds, setFinalizedPlayerIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (room?.status === 'finished') {
            // Fetch ALL end_game moves to know who has finalized
            const checkFinalizations = async () => {
                const { data } = await supabase
                    .from('moves')
                    .select('player_id')
                    .eq('room_code', roomCode)
                    .eq('move_type', 'end_game')

                if (data) {
                    const finalizedIds = new Set(data.map(m => m.player_id))
                    setFinalizedPlayerIds(finalizedIds)
                    if (myPlayerId && finalizedIds.has(myPlayerId)) {
                        setHasFinalized(true)
                    }
                }
            }
            checkFinalizations()
        }
    }, [room?.status, myPlayerId, roomCode, moves]) // depend on moves to update when new submissions happen

    // Subscribe to realtime updates
    useEffect(() => {
        if (!roomCode) return

        const channel = supabase
            .channel(`room:${roomCode}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rooms',
                    filter: `room_code=eq.${roomCode}`,
                },
                (payload) => {
                    console.log('Room update:', payload)
                    if (payload.eventType === 'DELETE') {
                        alert('The room has been deleted by the host.')
                        localStorage.removeItem('scrabble_session')
                        router.push('/')
                        return
                    }
                    setRoom(payload.new as Room)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'players',
                    filter: `room_code=eq.${roomCode}`,
                },
                (payload) => {
                    console.log('Player update:', payload)
                    // Reload all players and re-sort
                    supabase
                        .from('players')
                        .select('*')
                        .eq('room_code', roomCode)
                        .order('total_score', { ascending: false })
                        .then(({ data }) => {
                            if (data) setPlayers(data)
                        })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'moves',
                    filter: `room_code=eq.${roomCode}`,
                },
                (payload) => {
                    console.log('Move update:', payload)
                    if (payload.eventType === 'INSERT') {
                        setMoves((prev) => [payload.new as Move, ...prev].slice(0, 20))
                    } else if (payload.eventType === 'DELETE') {
                        // Reload moves since DELETE payload might not have full old record
                        supabase
                            .from('moves')
                            .select('*')
                            .eq('room_code', roomCode)
                            .order('created_at', { ascending: false })
                            .limit(20)
                            .then(({ data }) => {
                                if (data) setMoves(data)
                            })
                    }

                    // Also refresh room state to ensure turn index is synced
                    supabase
                        .from('rooms')
                        .select('*')
                        .eq('room_code', roomCode)
                        .single()
                        .then(({ data }) => {
                            if (data) setRoom(data)
                        })
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status)
                // Supabase returns status as a string like 'SUBSCRIBED', 'CHANNEL_ERROR', etc.
                setConnectionStatus(status as string)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomCode])

    // Specific subscription for Room Deletion (requires ID filter)
    useEffect(() => {
        if (!room?.id) return

        const channel = supabase
            .channel(`room_delete:${room.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${room.id}`,
                },
                () => {
                    localStorage.removeItem('scrabble_session')
                    router.push('/')
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [room?.id, router])

    const handleLeaveRoom = () => {
        setIsLeaveModalOpen(true)
    }

    const confirmLeaveRoom = () => {
        localStorage.removeItem('scrabble_session')
        router.push('/')
    }

    const handleDeleteRoom = () => {
        setIsDeleteModalOpen(true)
    }

    const confirmDeleteRoom = async () => {
        try {
            const res = await fetch('/api/rooms/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to delete room')
            }

            router.push('/')
        } catch (err: any) {
            console.error('Failed to delete room:', err)
            alert(err.message)
        } finally {
            setIsDeleteModalOpen(false)
        }
    }

    const handleEndGame = () => {
        setIsEndGameModalOpen(true)
    }

    const confirmEndGame = async () => {
        try {
            const res = await fetch('/api/rooms/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, playerId: myPlayerId }),
            })

            if (!res.ok) throw new Error('Failed to end game')

        } catch (err: any) {
            console.error('End game error:', err)
            alert(err.message)
        } finally {
            setIsEndGameModalOpen(false)
        }
    }

    const handlePauseGame = async () => {
        if (!myPlayerId || !room) return

        try {
            const action = room.is_paused ? 'resume' : 'pause'
            const res = await fetch('/api/rooms/pause', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, playerId: myPlayerId, action }),
            })

            if (!res.ok) throw new Error('Failed to update pause state')

        } catch (err) {
            console.error('Pause error:', err)
            alert('Failed to update game state')
        }
    }

    const handleOpenTimerSettings = async () => {
        // Auto-pause the game when opening timer settings
        if (room && !room.is_paused) {
            try {
                const res = await fetch('/api/rooms/pause', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomCode, playerId: myPlayerId, action: 'pause' }),
                })
                if (res.ok) {
                    setShowTimerSettings(true)
                }
            } catch (err) {
                console.error('Failed to pause for timer settings:', err)
                // Still open modal even if pause fails
                setShowTimerSettings(true)
            }
        } else {
            setShowTimerSettings(true)
        }
    }

    const handleCloseTimerSettings = async (updated: boolean = false) => {
        setShowTimerSettings(false)

        // Auto-resume the game after closing timer settings (if it was auto-paused)
        // Only resume if we actually updated the timer, otherwise user might have just cancelled
        if (room && room.is_paused && updated) {
            try {
                await fetch('/api/rooms/pause', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomCode, playerId: myPlayerId, action: 'resume' }),
                })
            } catch (err) {
                console.error('Failed to resume after timer settings:', err)
            }
        }
    }

    const handleUpdateTimer = async (timerSeconds: number) => {
        if (!myPlayerId) return

        const res = await fetch('/api/rooms/update-timer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomCode, playerId: myPlayerId, timerSeconds }),
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Failed to update timer')
        }

        // Close and resume after successful update
        await handleCloseTimerSettings(true)
    }

    const handleStartGame = async () => {
        if (!myPlayerId || isStarting) return

        setIsStarting(true)

        try {
            const res = await fetch('/api/rooms/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, playerId: myPlayerId }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to start game')
            }

            // Manually set status to ensure immediate UI update
            // Realtime will confirm this later
            if (room) {
                setRoom({
                    ...room,
                    status: 'playing',
                    turn_started_at: new Date().toISOString()
                })
            }
        } catch (err: any) {
            console.error('Failed to start game:', err)
            setIsStarting(false) // Only reset on error (success keeps it true until view switch)
            alert(err.message)
        }
    }

    const handleTimerExpired = async () => {
        // Determine who is skipping turn
        // In Single-Device, it's the current turn player
        let skipPlayerId = myPlayerId

        if (isSingleDevice) {
            // Find current turn player
            const currentTurn = players.find(p => p.role === 'player' && p.seat_order === room?.current_turn_index)
            if (currentTurn) skipPlayerId = currentTurn.id
        }

        if (!skipPlayerId) return

        // Auto-skip turn when timer expires
        try {
            await fetch('/api/moves/skip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, playerId: skipPlayerId }),
            })
        } catch (err: any) {
            console.error('Auto-skip failed:', err)
        }
    }

    const handlePassDeviceReady = async () => {
        setShowPassDevice(false)

        // Reset timer when player is ready (Single-Device mode only)
        // This ensures the timer starts effectively when they actually look at the screen
        if (isSingleDevice && room?.turn_timer_enabled && myPlayerId) {
            try {
                await fetch('/api/rooms/reset-timer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomCode, playerId: myPlayerId }), // Host resets it
                })
            } catch (err) {
                console.error('Failed to reset timer:', err)
            }
        }
    }

    // Show pass-device overlay when turn changes in single-device mode
    useEffect(() => {
        if (!isSingleDevice || !room || room.status !== 'playing') return

        const currentTurnPlayer = players.find(
            p => p.role === 'player' && p.seat_order === room.current_turn_index
        )

        if (currentTurnPlayer) {
            setShowPassDevice(true)
        }
    }, [room?.current_turn_index, isSingleDevice, room?.status, players])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-muted">Loading game...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="card max-w-md">
                    <h2 className="text-xl font-bold mb-2 text-red-400">Error</h2>
                    <p className="text-text-muted mb-4">{error}</p>
                    <button onClick={() => router.push('/')} className="btn-primary">
                        Back to Home
                    </button>
                </div>
            </div>
        )
    }

    const currentPlayer = players.find(p => p.id === myPlayerId) || null
    const isAdmin = currentPlayer?.role === 'player' && currentPlayer?.seat_order === 0

    const currentTurnPlayer = players.find(
        (p) => p.role === 'player' && p.seat_order === room?.current_turn_index
    )

    const isMyTurn = isSingleDevice || (currentPlayer?.role === 'player' &&
        currentPlayer?.seat_order === room?.current_turn_index)

    // Show lobby if room status is 'waiting'
    if (room?.status === 'waiting') {
        return (
            <LobbyView
                roomCode={roomCode}
                players={players}
                isHost={isAdmin}
                onStartGame={handleStartGame}
                gameMode={room.game_mode}
                isStarting={isStarting}
            />
        )
    }

    // Get next player name for pass-device overlay
    const nextPlayer = players.find(
        p => p.role === 'player' && p.seat_order === room?.current_turn_index
    )

    const renderEndGameView = () => {
        // Find the next player who hasn't finalized (only relevant for Single Device mainly)
        const unfinalizedPlayer = isSingleDevice
            ? players.find(p => p.role === 'player' && !finalizedPlayerIds.has(p.id))
            : null

        // Determine if WE should show the form
        // Single Device: If there is ANY unfinalized player, show form for them
        // Multi Device: If I haven't finalized, show form for ME
        const shouldShowForm = isSingleDevice
            ? !!unfinalizedPlayer
            : (!hasFinalized && currentPlayer?.role !== 'spectator')

        const playerForForm = isSingleDevice ? unfinalizedPlayer : currentPlayer

        if (shouldShowForm && playerForForm) {
            return (
                <EndGameForm
                    key={playerForForm.id}
                    roomCode={roomCode}
                    playerId={playerForForm.id}
                    playerName={playerForForm.name}
                    onFinalized={() => {
                        setHasFinalized(true)
                        // Trigger refresh of data
                        loadGameData(myPlayerId!)
                    }}
                />
            )
        }

        return (
            <div className="card p-6 text-center space-y-4">
                <div className="text-4xl">🏁</div>
                <h2 className="text-xl font-bold">Game Finished!</h2>
                <p className="text-text-muted">
                    {currentPlayer?.role === 'spectator'
                        ? "The game has ended."
                        : "You have finalized your score."}
                </p>
                <div className="text-sm bg-black/20 p-3 rounded">
                    Check the leaderboard to see the final standings!
                </div>
                <button
                    onClick={isAdmin ? confirmDeleteRoom : () => router.push('/')}
                    className={`w-full py-2 btn-secondary ${isAdmin ? 'bg-red-900/50 hover:bg-red-900 text-red-200 border-red-800' : ''}`}
                >
                    {isAdmin ? 'End Game & Delete Room' : 'Back to Home'}
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-2 md:p-4">
            {/* Pass Device Overlay (Single-Device Mode Only) */}
            {isSingleDevice && nextPlayer && (
                <PassDeviceOverlay
                    isVisible={showPassDevice}
                    nextPlayerName={nextPlayer.name}
                    onReady={handlePassDeviceReady}
                />
            )}

            {/* Paused Overlay */}
            {room?.is_paused && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-gradient-to-br from-primary/20 to-secondary border-2 border-primary rounded-2xl p-5 md:p-6 max-w-xs md:max-w-sm w-full text-center shadow-2xl">

                        <h2 className="text-lg md:text-xl font-bold mb-1 text-white">Game Paused</h2>
                        <p className="text-text-muted text-xs md:text-sm mb-3 md:mb-4">The host has paused the game.</p>
                        <button onClick={handlePauseGame} className="btn-primary w-full py-2 md:py-2.5 text-sm md:text-base font-bold">
                            Continue
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Room?"
                message="Are you sure you want to delete this room? This action cannot be undone and all players will be disconnected."
                onConfirm={confirmDeleteRoom}
                onCancel={() => setIsDeleteModalOpen(false)}
                confirmText="Delete Room"
                isDanger={true}
            />

            <ConfirmationModal
                isOpen={isLeaveModalOpen}
                title="Leave Room?"
                message="Are you sure you want to leave this game? You can rejoin later using the room code if the game is still active."
                onConfirm={confirmLeaveRoom}
                onCancel={() => setIsLeaveModalOpen(false)}
                confirmText="Leave Game"
                isDanger={false}
            />

            <ConfirmationModal
                isOpen={isEndGameModalOpen}
                title="End Game?"
                message="Are you sure you want to end the game? All players will be asked to enter their remaining tiles for final scoring."
                onConfirm={confirmEndGame}
                onCancel={() => setIsEndGameModalOpen(false)}
                confirmText="End Game Now"
                isDanger={true}
            />
            {/* Header - Responsive with Mobile Menu */}
            <header className="mb-3 md:mb-6 relative z-50">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-primary">SCRABBLE</h1>
                        <p className="text-xs md:text-sm text-text-muted">Room: {roomCode}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Live Indicator - Always Visible */}
                        <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${connectionStatus === 'SUBSCRIBED'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                            }`}>
                            {connectionStatus === 'SUBSCRIBED' ? '● Live' : '○ Connecting...'}
                        </div>

                        {/* Desktop Buttons (Hidden on Mobile) */}
                        <div className="hidden md:flex gap-2 items-center">
                            {isAdmin && room?.status === 'playing' && room?.turn_timer_enabled && (
                                <button
                                    onClick={handleOpenTimerSettings}
                                    className="px-3 py-2 rounded-lg transition-all font-semibold text-sm flex items-center gap-1 bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Timer
                                </button>
                            )}

                            {/* Pause Button - Host Only */}
                            {isAdmin && room?.status === 'playing' && (
                                <button
                                    onClick={handlePauseGame}
                                    className={`px-3 py-2 rounded-lg transition-all font-semibold text-sm flex items-center gap-1 ${room.is_paused
                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'
                                        : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                                        }`}
                                >
                                    {room.is_paused ? 'Resume' : 'Pause'}
                                </button>
                            )}

                            {isAdmin && room?.status === 'playing' && (
                                <button
                                    onClick={handleEndGame}
                                    className="px-3 py-2 bg-purple-900/50 text-purple-200 border border-purple-800 rounded-lg hover:bg-purple-900 transition-all font-semibold text-sm"
                                >
                                    End Game
                                </button>
                            )}

                            {isAdmin && (
                                <button
                                    onClick={handleDeleteRoom}
                                    className="px-3 py-2 bg-red-900/50 text-red-200 border border-red-800 rounded-lg hover:bg-red-900 transition-all font-semibold text-sm flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Delete
                                </button>
                            )}

                            <button
                                onClick={handleLeaveRoom}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold text-base"
                            >
                                Leave
                            </button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-text-muted hover:text-white bg-card border border-white/10 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1 md:hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden">
                        {isAdmin && room?.status === 'playing' && (
                            <button
                                onClick={() => {
                                    handlePauseGame()
                                    setIsMobileMenuOpen(false)
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg font-semibold flex items-center gap-3 ${room.is_paused
                                    ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                                    : 'hover:bg-white/5 text-gray-300'}`}
                            >
                                {room.is_paused ? (
                                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Resume Game</>
                                ) : (
                                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Pause Game</>
                                )}
                            </button>
                        )}

                        {isAdmin && room?.status === 'playing' && room?.turn_timer_enabled && (
                            <button
                                onClick={() => {
                                    handleOpenTimerSettings()
                                    setIsMobileMenuOpen(false)
                                }}
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-gray-300 font-semibold flex items-center gap-3"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Timer Settings
                            </button>
                        )}

                        {isAdmin && room?.status === 'playing' && (
                            <button
                                onClick={() => {
                                    handleEndGame()
                                    setIsMobileMenuOpen(false)
                                }}
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-500/10 text-purple-300 font-semibold flex items-center gap-3"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                End Game
                            </button>
                        )}

                        {isAdmin && (
                            <button
                                onClick={() => {
                                    handleDeleteRoom()
                                    setIsMobileMenuOpen(false)
                                }}
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-300 font-semibold flex items-center gap-3"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete Room
                            </button>
                        )}

                        <div className="h-px bg-white/10 my-1"></div>

                        <button
                            onClick={() => {
                                setShowAbout(true)
                                setIsMobileMenuOpen(false)
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-gray-400 font-semibold flex items-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            About
                        </button>

                        <button
                            onClick={() => {
                                setShowHowToUse(true)
                                setIsMobileMenuOpen(false)
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-gray-400 font-semibold flex items-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            How To Use
                        </button>

                        <div className="h-px bg-white/10 my-1"></div>

                        <button
                            onClick={() => {
                                handleLeaveRoom()
                                setIsMobileMenuOpen(false)
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-200 font-semibold flex items-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Leave Room
                        </button>
                    </div>
                )}

                {/* Desktop Help Links */}
                <div className="hidden md:flex items-center gap-3 text-xs mt-2">
                    <button onClick={() => setShowAbout(true)} className="text-white/50 hover:text-primary transition-colors hover:underline">About</button>
                    <span className="text-white/30">•</span>
                    <button onClick={() => setShowHowToUse(true)} className="text-white/50 hover:text-primary transition-colors hover:underline">How To Use</button>
                </div>
            </header>


            {/* Main Grid */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 md:gap-6">
                {/* Left Column - Order 2 on mobile */}
                <div className="space-y-3 md:space-y-6 order-2 lg:order-none">
                    {/* Show Current Turn FIRST on mobile to give context */}
                    {
                        currentTurnPlayer && room && (
                            <CurrentTurn
                                player={currentTurnPlayer}
                                room={room}
                                onTimerExpired={handleTimerExpired}
                            />
                        )
                    }
                    {room && <TileBag bag={room.tile_bag || INITIAL_TILE_DISTRIBUTION} />}
                    <LiveLeaderboard players={players} />
                </div >

                {/* Middle Column - Order 3 on mobile */}
                < div className="order-3 lg:order-none" >
                    <RecentWords moves={moves} players={players} />
                </div >

                {/* Right Column - Order 1 on mobile (Input first) */}
                <div className="space-y-3 md:space-y-6 order-1 lg:order-none">
                    {room?.status === 'finished' ? (
                        /* End Game View */
                        renderEndGameView()
                    ) : (
                        /* Normal Game Play */
                        (isSingleDevice ? currentTurnPlayer : currentPlayer) && (
                            <SubmitWordForm
                                roomCode={roomCode}
                                playerId={(isSingleDevice && currentTurnPlayer?.id) || currentPlayer?.id || ''}
                                hostId={isSingleDevice ? currentPlayer?.id : undefined}
                                isMyTurn={isMyTurn}
                                isSpectator={currentPlayer?.role === 'spectator'}
                                isHost={isAdmin}
                            />
                        )
                    )
                    }
                </div>
            </div>

            {/* Modals */}
            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
            <HowToUseModal isOpen={showHowToUse} onClose={() => setShowHowToUse(false)} />
            <TimerSettingsModal
                isOpen={showTimerSettings}
                currentSeconds={room?.turn_timer_seconds || 60}
                onClose={() => handleCloseTimerSettings(false)}
                onUpdate={handleUpdateTimer}
            />
        </div>
    )
}
