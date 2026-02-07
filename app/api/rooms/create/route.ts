import { NextRequest, NextResponse } from 'next/server'
import { supabase, generateRoomCode } from '@/lib/supabase'
import { INITIAL_TILE_DISTRIBUTION } from '@/lib/scoring'

export async function POST(request: NextRequest) {
    try {
        const {
            playerName,
            gameMode = 'multi-device',
            turnTimerEnabled = false,
            turnTimerSeconds = 60,
            playerNames = [] // For single-device mode
        } = await request.json()

        // Validation
        if (gameMode === 'single-device') {
            if (!playerNames || playerNames.length < 2 || playerNames.length > 4) {
                return NextResponse.json(
                    { error: 'Single-device mode requires 2-4 player names' },
                    { status: 400 }
                )
            }
            // Check for duplicate names
            const uniqueNames = new Set(playerNames.map((n: string) => n.trim().toLowerCase()))
            if (uniqueNames.size !== playerNames.length) {
                return NextResponse.json(
                    { error: 'Player names must be unique' },
                    { status: 400 }
                )
            }
        } else {
            // Multi-device mode
            if (!playerName || !playerName.trim()) {
                return NextResponse.json(
                    { error: 'Player name is required' },
                    { status: 400 }
                )
            }
        }

        // Validate timer settings
        if (turnTimerEnabled && (turnTimerSeconds < 10 || turnTimerSeconds > 300)) {
            return NextResponse.json(
                { error: 'Timer must be between 10 and 300 seconds' },
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

        // Create room with new fields
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .insert({
                room_code: roomCode,
                status: 'waiting',
                current_turn_index: 0,
                game_mode: gameMode,
                turn_timer_enabled: turnTimerEnabled,
                turn_timer_seconds: turnTimerSeconds,
                turn_started_at: null, // Will be set when game starts
                tile_bag: INITIAL_TILE_DISTRIBUTION,
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

        // Create players based on game mode
        if (gameMode === 'single-device') {
            // Create all players at once
            const playersToInsert = playerNames.map((name: string, index: number) => ({
                room_code: roomCode,
                name: name.trim(),
                total_score: 0,
                seat_order: index,
                role: 'player',
            }))

            const { data: players, error: playersError } = await supabase
                .from('players')
                .insert(playersToInsert)
                .select()

            if (playersError) {
                console.error('Players creation error:', playersError)
                // Clean up room if player creation fails
                await supabase.from('rooms').delete().eq('room_code', roomCode)
                return NextResponse.json(
                    { error: 'Failed to create players' },
                    { status: 500 }
                )
            }

            return NextResponse.json({
                roomCode,
                gameMode,
                playerIds: players.map(p => p.id),
                hostPlayerId: players[0].id, // First player is host
            })
        } else {
            // Multi-device mode: create only the host player
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
                gameMode,
                playerId: player.id,
                role: player.role,
            })
        }
    } catch (error) {
        console.error('Create room error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
