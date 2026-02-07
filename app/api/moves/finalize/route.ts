import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { roomCode, playerId, tiles, deduction } = await request.json()

        if (!roomCode || !playerId || deduction === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get player
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .eq('room_code', roomCode)
            .single()

        if (playerError || !player) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 })
        }

        // Check if already finalized
        const { data: existingMove } = await supabase
            .from('moves')
            .select('id')
            .eq('room_code', roomCode)
            .eq('player_id', playerId)
            .eq('move_type', 'end_game')
            .single()

        if (existingMove) {
            return NextResponse.json({ error: 'Already finalized' }, { status: 400 })
        }

        // 1. Record move
        const { error: moveError } = await supabase
            .from('moves')
            .insert({
                room_code: roomCode,
                player_id: playerId,
                word_played: `LEFTOVER: ${tiles || '(NONE)'}`,
                points_scored: -deduction, // Negative score
                move_type: 'end_game'
            })

        if (moveError) {
            return NextResponse.json({ error: 'Failed to record move' }, { status: 500 })
        }

        // 2. Update player total
        const { error: updateError } = await supabase
            .from('players')
            .update({ total_score: player.total_score - deduction })
            .eq('id', playerId)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update score' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Finalize error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
