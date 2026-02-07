import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { subtractFromBag, TileData } from '@/lib/scoring'

export async function POST(request: NextRequest) {
    try {
        const { roomCode, playerId, word, points, details = [] } = await request.json()

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

        // Pre-calculate next state
        const allTiles: TileData[] = (details as any[]).flatMap((d: any) => d.tiles || [])
        const newBag = subtractFromBag(room.tile_bag || {}, allTiles)
        const nextTurnIndex = (room.current_turn_index + 1) % playerCount

        let turnStartedAt = null
        if (room.turn_timer_enabled) {
            if (room.game_mode === 'single-device') {
                turnStartedAt = null
            } else {
                turnStartedAt = new Date().toISOString()
            }
        }

        // Execute atomic transaction
        const { error: rpcError } = await supabase.rpc('submit_move_atomic', {
            p_room_code: roomCode,
            p_player_id: playerId,
            p_word: word.trim().toUpperCase(),
            p_points: points,
            p_details: details,
            p_new_bag: newBag,
            p_next_turn: nextTurnIndex,
            p_turn_started_at: turnStartedAt
        })

        if (rpcError) {
            console.error('Submit RPC error:', rpcError)
            return NextResponse.json(
                { error: 'Failed to submit move. Please ensure database migrations are applied.' },
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
