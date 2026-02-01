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
                message: 'Welcome back! Rejoined successfully.',
            })
        }

        // Count existing players (not spectators)
        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('*')
            .eq('room_code', trimmedCode)
            .eq('role', 'player')

        if (playersError) {
            console.error('Players query error:', playersError)
            return NextResponse.json(
                { error: 'Failed to check player count' },
                { status: 500 }
            )
        }

        // Determine role: player if < 4 players and not forcing spectator
        const playerCount = players?.length || 0
        const role = forceSpectator || playerCount >= 4 ? 'spectator' : 'player'

        // Assign seat order only for players
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

        return NextResponse.json({
            playerId: newPlayer.id,
            role: newPlayer.role,
            message: role === 'spectator' && playerCount >= 4
                ? 'Room is full. You joined as a spectator.'
                : undefined,
        })
    } catch (error) {
        console.error('Join room error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
