import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { roomCode, playerId, word, points } = await request.json()

        if (!roomCode || !playerId || !word || points === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (points < 0) {
            return NextResponse.json(
                { error: 'Points must be non-negative' },
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

        // Validate it's the player's turn (skip for single-device mode)
        if (room.game_mode !== 'single-device' && player.seat_order !== room.current_turn_index) {
            return NextResponse.json(
                { error: 'Not your turn' },
                { status: 403 }
            )
        }

        // Validate player role
        if (player.role !== 'player') {
            return NextResponse.json(
                { error: 'Spectators cannot submit moves' },
                { status: 403 }
            )
        }

        // Get total player count for turn rotation
        const { data: allPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('room_code', roomCode)
            .eq('role', 'player')
            .order('seat_order')

        if (!allPlayers || allPlayers.length === 0) {
            return NextResponse.json(
                { error: 'No players found' },
                { status: 500 }
            )
        }

        const playerCount = allPlayers.length

        // Execute transaction: insert move, update score, advance turn
        // Note: Supabase doesn't support true transactions in the client library
        // We'll do sequential operations with error handling

        // 1. Insert move
        const { error: moveError } = await supabase
            .from('moves')
            .insert({
                room_code: roomCode,
                player_id: playerId,
                word_played: word.trim().toUpperCase(),
                points_scored: points,
                move_type: 'word',
            })

        if (moveError) {
            console.error('Move insert error:', moveError)
            return NextResponse.json(
                { error: 'Failed to record move' },
                { status: 500 }
            )
        }

        // 2. Update player score
        const { error: scoreError } = await supabase
            .from('players')
            .update({ total_score: player.total_score + points })
            .eq('id', playerId)

        if (scoreError) {
            console.error('Score update error:', scoreError)
            return NextResponse.json(
                { error: 'Failed to update score' },
                { status: 500 }
            )
        }

        // 3. Advance turn and reset timer
        const nextTurnIndex = (room.current_turn_index + 1) % playerCount
        const updateData: any = { current_turn_index: nextTurnIndex }

        // Reset timer if enabled
        if (room.turn_timer_enabled) {
            // For single-device mode, we pause the timer (set to null) until they click "Ready"
            if (room.game_mode === 'single-device') {
                updateData.turn_started_at = null
            } else {
                updateData.turn_started_at = new Date().toISOString()
            }
        }

        const { error: turnError } = await supabase
            .from('rooms')
            .update(updateData)
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
        console.error('Submit move error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
