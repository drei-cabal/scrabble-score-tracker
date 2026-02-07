import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { addToBag, TileData } from '@/lib/scoring'

export async function POST(request: NextRequest) {
    try {
        const { roomCode, playerId } = await request.json()

        if (!roomCode || !playerId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
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
                { error: 'Only the host (Site 0) can undo moves' },
                { status: 403 }
            )
        }

        // 2. Get Last Move
        const { data: lastMove, error: moveFetchError } = await supabase
            .from('moves')
            .select('*')
            .eq('room_code', roomCode)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (moveFetchError || !lastMove) {
            return NextResponse.json(
                { error: 'No moves to undo' },
                { status: 404 }
            )
        }

        // 3. Get Room Info (for turn index)
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', roomCode)
            .single()

        if (roomError || !room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        // 4. Get Player who made the move (to revert score)
        const { data: movePlayer, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', lastMove.player_id)
            .single()

        if (playerError || !movePlayer) {
            console.error("Player who made the move not found, maybe deleted?")
            // Proceed to delete move anyway? safer to error out or handle explicitly.
            return NextResponse.json({ error: 'Original player not found' }, { status: 404 })
        }

        // 5. Execute Atomic Undo

        // A. Restore Tile Bag
        const details = lastMove.move_details || []
        const allTiles: TileData[] = (details as any[]).flatMap((d: any) => d.tiles || [])
        const restoredBag = addToBag(room.tile_bag || {}, allTiles)

        // B. Revert Turn Index
        const { data: allPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('room_code', roomCode)
            .eq('role', 'player')

        const playerCount = allPlayers?.length || 1
        const prevTurnIndex = (room.current_turn_index - 1 + playerCount) % playerCount

        // C. Call Atomic RPC
        const { error: rpcError } = await supabase.rpc('undo_move_atomic', {
            p_room_code: roomCode,
            p_move_id: lastMove.id,
            p_player_id: movePlayer.id,
            p_points_to_revert: lastMove.points_scored,
            p_restored_bag: restoredBag,
            p_prev_turn_index: prevTurnIndex
        })

        if (rpcError) {
            console.error('Undo RPC error:', rpcError)
            return NextResponse.json(
                { error: 'Failed to undo move. Please ensure database migrations are applied.' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, invertedMove: lastMove })

    } catch (error: any) {
        console.error('Undo error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
