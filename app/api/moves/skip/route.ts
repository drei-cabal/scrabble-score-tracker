import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { roomCode, playerId } = await request.json()

        if (!roomCode || !playerId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get current room state
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

        // Get player info
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

        // Validate it's the player's turn
        if (player.seat_order !== room.current_turn_index) {
            return NextResponse.json(
                { error: 'Not your turn' },
                { status: 403 }
            )
        }

        if (player.role !== 'player') {
            return NextResponse.json(
                { error: 'Spectators cannot skip turns' },
                { status: 403 }
            )
        }

        // Get player count
        const { data: allPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('room_code', roomCode)
            .eq('role', 'player')

        const playerCount = allPlayers?.length || 1

        // Insert skip move
        const { error: moveError } = await supabase
            .from('moves')
            .insert({
                room_code: roomCode,
                player_id: playerId,
                word_played: null,
                points_scored: 0,
                move_type: 'skip',
            })

        if (moveError) {
            console.error('Skip move error:', moveError)
            return NextResponse.json(
                { error: 'Failed to record skip' },
                { status: 500 }
            )
        }

        // Advance turn
        const nextTurnIndex = (room.current_turn_index + 1) % playerCount
        const { error: turnError } = await supabase
            .from('rooms')
            .update({ current_turn_index: nextTurnIndex })
            .eq('room_code', roomCode)

        if (turnError) {
            console.error('Turn update error:', turnError)
            return NextResponse.json(
                { error: 'Failed to advance turn' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            nextTurnIndex,
        })
    } catch (error) {
        console.error('Skip turn error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
