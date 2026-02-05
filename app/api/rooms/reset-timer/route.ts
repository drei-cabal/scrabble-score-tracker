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

        // Verify player is in the room (and potentially check if they are host or current player)
        // For simplicity, we just check if they are a valid player/host in the room
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .eq('room_code', roomCode)
            .single()

        if (playerError || !player) {
            return NextResponse.json({ error: 'Player not found' }, { status: 403 })
        }

        // Reset the timer to NOW
        const { error: roomError } = await supabase
            .from('rooms')
            .update({ turn_started_at: new Date().toISOString() })
            .eq('room_code', roomCode)

        if (roomError) {
            return NextResponse.json({ error: 'Failed to reset timer' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Reset timer error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
