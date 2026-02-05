import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { roomCode, playerId, timerSeconds } = await request.json()

        if (!roomCode || !playerId || !timerSeconds) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate timer range (10-300 seconds)
        if (timerSeconds < 10 || timerSeconds > 300) {
            return NextResponse.json(
                { error: 'Timer must be between 10 and 300 seconds' },
                { status: 400 }
            )
        }

        // 1. Verify Requestor is Host
        const { data: requestor, error: reqError } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .eq('room_code', roomCode)
            .single()

        if (reqError || !requestor) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 })
        }

        if (requestor.seat_order !== 0) {
            return NextResponse.json(
                { error: 'Only the host can adjust the timer' },
                { status: 403 }
            )
        }

        // 2. Update Timer Settings
        const { error: updateError } = await supabase
            .from('rooms')
            .update({
                turn_timer_seconds: timerSeconds,
                turn_started_at: new Date().toISOString() // Reset current turn timer
            })
            .eq('room_code', roomCode)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update timer' }, { status: 500 })
        }

        return NextResponse.json({ success: true, timerSeconds })

    } catch (error: any) {
        console.error('Update timer error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
