'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Room, type Player, type Move } from '@/lib/supabase'
import LiveLeaderboard from '@/components/LiveLeaderboard'
import RecentWords from '@/components/RecentWords'
import CurrentTurn from '@/components/CurrentTurn'
import SubmitWordForm from '@/components/SubmitWordForm'
import ConfirmationModal from '@/components/ConfirmationModal'

export default function GamePage() {
    const params = useParams()
    const router = useRouter()
    const roomCode = params.roomCode as string

    const [room, setRoom] = useState<Room | null>(null)
    const [players, setPlayers] = useState<Player[]>([])
    const [moves, setMoves] = useState<Move[]>([])
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [connectionStatus, setConnectionStatus] = useState('CONNECTING')
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

    // Load session from localStorage
    useEffect(() => {
        const sessionData = localStorage.getItem('scrabble_session')
        if (!sessionData) {
            router.push('/')
            return
        }

        const session = JSON.parse(sessionData)
        if (session.roomCode !== roomCode) {
            router.push('/')
            return
        }

        setMyPlayerId(session.playerId)
        loadGameData(session.playerId)
    }, [roomCode, router])

    const loadGameData = async (playerId: string) => {
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
    }

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
                    event: 'INSERT',
                    schema: 'public',
                    table: 'moves',
                    filter: `room_code=eq.${roomCode}`,
                },
                (payload) => {
                    console.log('New move:', payload)
                    setMoves((prev) => [payload.new as Move, ...prev].slice(0, 20))

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
                setConnectionStatus(status)
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

    const isMyTurn = currentPlayer?.role === 'player' &&
        currentPlayer?.seat_order === room?.current_turn_index

    return (
        <div className="min-h-screen p-2 md:p-4">
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
            {/* Header - Compact on mobile */}
            <header className="mb-3 md:mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-primary">SCRABBLE</h1>
                    <p className="text-xs md:text-sm text-text-muted">Room: {roomCode}</p>
                </div>
                <div className="flex gap-1 md:gap-2 items-center">
                    <div className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${connectionStatus === 'SUBSCRIBED'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        }`}>
                        {connectionStatus === 'SUBSCRIBED' ? '● Live' : '○ Connecting...'}
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleDeleteRoom}
                            className="px-2 md:px-4 py-1 md:py-2 bg-red-900/50 text-red-200 border border-red-800 rounded-lg hover:bg-red-900 transition-all font-semibold text-xs md:text-sm flex items-center gap-1"
                            title="Delete Room"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden md:inline">Delete Room</span>
                        </button>
                    )}
                    <button
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="hidden md:block p-2 bg-secondary rounded-lg hover:bg-opacity-80 transition-all"
                        title="Open in new window"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                    <button
                        onClick={handleLeaveRoom}
                        className="px-2 md:px-4 py-1 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold text-xs md:text-base"
                    >
                        Leave
                    </button>
                </div>
            </header>

            {/* Main Grid */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 md:gap-6">
                {/* Left Column - Order 2 on mobile */}
                <div className="space-y-3 md:space-y-6 order-2 lg:order-none">
                    {/* Show Current Turn FIRST on mobile to give context */}
                    {currentTurnPlayer && <CurrentTurn player={currentTurnPlayer} />}
                    <LiveLeaderboard players={players} />
                </div>

                {/* Middle Column - Order 3 on mobile */}
                <div className="order-3 lg:order-none">
                    <RecentWords moves={moves} players={players} />
                </div>

                {/* Right Column - Order 1 on mobile (Input first) */}
                <div className="space-y-3 md:space-y-6 order-1 lg:order-none">
                    {currentPlayer && (
                        <SubmitWordForm
                            roomCode={roomCode}
                            playerId={currentPlayer.id}
                            isMyTurn={isMyTurn}
                            isSpectator={currentPlayer.role === 'spectator'}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
