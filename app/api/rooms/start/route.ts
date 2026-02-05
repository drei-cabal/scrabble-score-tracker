import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { roomCode, playerId } = await request.json()

        if (!roomCode || !playerId) {
            return NextResponse.json(
                { error: 'Room code and player ID are required' },
                { status: 400 }
            )
        }

        // Get room
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', roomCode)
            .single()

        if (roomError || !room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            )
        }

        // Verify requester is the host (seat_order === 0)
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .eq('room_code', roomCode)
            .single()

        if (playerError || !player) {
            return NextResponse.json(
                { error: 'Player not found' },
                { status: 404 }
            )
        }

        if (player.seat_order !== 0 || player.role !== 'player') {
            return NextResponse.json(
                { error: 'Only the host can start the game' },
                { status: 403 }
            )
        }

        // Check if there are at least 2 players
        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('*')
            .eq('room_code', roomCode)
            .eq('role', 'player')

        if (playersError) {
            return NextResponse.json(
                { error: 'Failed to check players' },
                { status: 500 }
            )
        }

        if (!players || players.length < 2) {
            return NextResponse.json(
                { error: 'At least 2 players are required to start the game' },
                { status: 400 }
            )
        }

        // Update room status to 'playing' and set turn_started_at if timer is enabled
        const updateData: any = {
            status: 'playing',
        }

        if (room.turn_timer_enabled) {
            // For single-device mode, we pause the timer (set to null) until they click "Ready"
            if (room.game_mode === 'single-device') {
                updateData.turn_started_at = null
            } else {
                updateData.turn_started_at = new Date().toISOString()
            }
        }

        const { error: updateError } = await supabase
            .from('rooms')
            .update(updateData)
            .eq('room_code', roomCode)

        if (updateError) {
            console.error('Failed to start game:', updateError)
            return NextResponse.json(
                { error: 'Failed to start game' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Game started successfully',
        })
    } catch (error) {
        console.error('Start game error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
