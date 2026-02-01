import { NextRequest, NextResponse } from 'next/server'
import { supabase, generateRoomCode } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { playerName } = await request.json()

        if (!playerName || !playerName.trim()) {
            return NextResponse.json(
                { error: 'Player name is required' },
                { status: 400 }
            )
        }

        // Generate unique room code
        let roomCode = ''
        let isUnique = false
        let attempts = 0

        while (!isUnique && attempts < 10) {
            roomCode = generateRoomCode()

            const { data: existing } = await supabase
                .from('rooms')
                .select('room_code')
                .eq('room_code', roomCode)
                .single()

            if (!existing) {
                isUnique = true
            }
            attempts++
        }

        if (!isUnique) {
            return NextResponse.json(
                { error: 'Failed to generate unique room code. Please try again.' },
                { status: 500 }
            )
        }

        // Create room
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .insert({
                room_code: roomCode,
                status: 'waiting',
                current_turn_index: 0,
            })
            .select()
            .single()

        if (roomError) {
            console.error('Room creation error:', roomError)
            return NextResponse.json(
                { error: 'Failed to create room' },
                { status: 500 }
            )
        }

        // Create first player (host)
        const { data: player, error: playerError } = await supabase
            .from('players')
            .insert({
                room_code: roomCode,
                name: playerName.trim(),
                total_score: 0,
                seat_order: 0,
                role: 'player',
            })
            .select()
            .single()

        if (playerError) {
            console.error('Player creation error:', playerError)
            // Clean up room if player creation fails
            await supabase.from('rooms').delete().eq('room_code', roomCode)
            return NextResponse.json(
                { error: 'Failed to create player' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            roomCode,
            playerId: player.id,
            role: player.role,
        })
    } catch (error) {
        console.error('Create room error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
