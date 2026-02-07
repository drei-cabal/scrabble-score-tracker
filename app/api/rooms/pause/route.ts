import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { roomCode, playerId, action } = await request.json()

        if (!roomCode || !playerId || !action) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (action !== 'pause' && action !== 'resume') {
            return NextResponse.json(
                { error: 'Invalid action' },
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

        // 2. Prepare Updates
        const updates: any = {
            is_paused: (action === 'pause')
        }

        // When resuming, reset the timer logic so it doesn't instantly expire
        if (action === 'resume') {
            updates.turn_started_at = new Date().toISOString()
        }

        // 3. Update Room
        const { error: updateError } = await supabase
            .from('rooms')
            .update(updates)
            .eq('room_code', roomCode)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update game state' }, { status: 500 })
        }

        return NextResponse.json({ success: true, isPaused: updates.is_paused })

    } catch (error: any) {
        console.error('Pause game error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
