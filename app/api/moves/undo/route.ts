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

        // 5. Execute Undo Operations

        // A. Restore Tile Bag
        // Flatten all tiles from the move details
        const details = lastMove.move_details || []
        const allTiles: TileData[] = (details as any[]).flatMap(d => d.tiles || [])
        const restoredBag = addToBag(room.tile_bag || {}, allTiles)

        // B. Revert Turn Index & Bag
        // Get total valid players
        const { data: allPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('room_code', roomCode)
            .eq('role', 'player')

        const playerCount = allPlayers?.length || 1
        const prevTurnIndex = (room.current_turn_index - 1 + playerCount) % playerCount

        const { error: roomUpdateError } = await supabase
            .from('rooms')
            .update({
                current_turn_index: prevTurnIndex,
                tile_bag: restoredBag,
                turn_started_at: new Date().toISOString()
            })
            .eq('room_code', roomCode)

        if (roomUpdateError) {
            console.error("Failed to revert room state")
            return NextResponse.json({ error: 'Failed to revert room state' }, { status: 500 })
        }

        // C. Revert Score
        const newScore = Math.max(0, movePlayer.total_score - lastMove.points_scored)
        const { error: scoreError } = await supabase
            .from('players')
            .update({ total_score: newScore })
            .eq('id', movePlayer.id)

        if (scoreError) {
            console.error("CRITICAL: Room reverted but score not reverted")
            return NextResponse.json({ error: 'Failed to revert score' }, { status: 500 })
        }

        // D. Delete the move
        const { error: deleteError } = await supabase
            .from('moves')
            .delete()
            .eq('id', lastMove.id)

        if (deleteError) {
            console.error("CRITICAL: State reverted but move record remains", lastMove)
            return NextResponse.json({ error: 'Failed to delete move' }, { status: 500 })
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
