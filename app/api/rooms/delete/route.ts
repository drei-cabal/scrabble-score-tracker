
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const { roomCode } = await request.json()

        if (!roomCode) {
            return NextResponse.json(
                { error: 'Room code is required' },
                { status: 400 }
            )
        }

        // Delete related data first (Manual Cascade to handle missing FK constraints or RLS on cascade)
        await supabase.from('moves').delete().eq('room_code', roomCode)
        await supabase.from('players').delete().eq('room_code', roomCode)

        // Delete the room
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('room_code', roomCode)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
