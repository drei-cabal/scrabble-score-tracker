import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { roomCode, playerName, forceSpectator } = await request.json()

        if (!roomCode || !playerName) {
            return NextResponse.json(
                { error: 'Room code and player name are required' },
                { status: 400 }
            )
        }

        const trimmedCode = roomCode.trim().toUpperCase()
        const trimmedName = playerName.trim()

        // Check if room exists
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', trimmedCode)
            .single()

        if (roomError || !room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            )
        }

        // Check if name is already taken in this room
        const { data: existingPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('room_code', trimmedCode)
            .eq('name', trimmedName)
            .single()

        if (existingPlayer) {
            // Allow rejoin if name matches
            return NextResponse.json({
                playerId: existingPlayer.id,
                role: existingPlayer.role,
                isSingleDevice: room.game_mode === 'single-device',
                hostPlayerId: room.host_id, // Useful for single-device checks
                message: 'Welcome back! Rejoined successfully.',
            })
        }

        // Count existing players (not spectators)
        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('*')
            .eq('room_code', trimmedCode)
            .eq('role', 'player')
            .order('created_at', { ascending: true })

        if (playersError) {
            console.error('Players query error:', playersError)
            return NextResponse.json(
                { error: 'Failed to check player count' },
                { status: 500 }
            )
        }

        // Determine if game is already in progress
        const isGameInProgress = room.status === 'playing' || room.status === 'finished'
        const playerCount = players?.length || 0

        // Determine role:
        // - Force spectator if user requested it
        // - Force spectator if room is full (>= 4 players)
        // - Force spectator if game is already in progress
        // - Force spectator if Single Device mode (prevent remote players joining as active players)
        const shouldBeSpectator =
            forceSpectator ||
            playerCount >= 4 ||
            isGameInProgress ||
            room.game_mode === 'single-device'

        const role = shouldBeSpectator ? 'spectator' : 'player'

        // Assign seat order based on join order (created_at timestamp)
        // For players, seat_order is determined by their position in the join sequence
        const seatOrder = role === 'player' ? playerCount : null

        // Create player
        const { data: newPlayer, error: createError } = await supabase
            .from('players')
            .insert({
                room_code: trimmedCode,
                name: trimmedName,
                total_score: 0,
                seat_order: seatOrder,
                role: role,
            })
            .select()
            .single()

        if (createError) {
            console.error('Player creation error:', createError)
            return NextResponse.json(
                { error: 'Failed to join room' },
                { status: 500 }
            )
        }

        // Generate appropriate welcome message
        let message = ''
        if (role === 'spectator') {
            if (playerCount >= 4) message = 'Room is full. You joined as a spectator.'
            else if (isGameInProgress) message = 'Game in progress. You joined as a spectator.'
            else if (room.game_mode === 'single-device') message = 'Single-Device room. Remote access is spectator only.'
            else message = 'Joined as spectator.'
        }

        return NextResponse.json({
            playerId: newPlayer.id,
            role: newPlayer.role,
            isSingleDevice: room.game_mode === 'single-device',
            message: message || undefined,
        })
    } catch (error) {
        console.error('Join room error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
