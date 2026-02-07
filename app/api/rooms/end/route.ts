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

        // Verify host
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('role, seat_order')
            .eq('id', playerId)
            .eq('room_code', roomCode)
            .single()

        if (playerError || !player) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 })
        }

        if (player.role !== 'player' || player.seat_order !== 0) {
            return NextResponse.json({ error: 'Only host can end game' }, { status: 403 })
        }

        // Update room status
        const { error: updateError } = await supabase
            .from('rooms')
            .update({ status: 'finished', is_paused: false }) // Unpause if paused
            .eq('room_code', roomCode)

        if (updateError) {
            console.error('Update error:', updateError)
            return NextResponse.json({ error: 'Failed to end game' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('End game error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
