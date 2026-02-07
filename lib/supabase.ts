import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
})

// Database types
export interface Room {
    id: string
    room_code: string
    status: 'waiting' | 'playing' | 'finished'
    current_turn_index: number
    game_mode: 'multi-device' | 'single-device'
    turn_timer_enabled: boolean
    turn_timer_seconds: number
    turn_started_at: string | null
    is_paused: boolean
    tile_bag: Record<string, number>
    created_at: string
    updated_at: string
}

export interface Player {
    id: string
    room_code: string
    name: string
    total_score: number
    seat_order: number | null
    role: 'player' | 'spectator'
    created_at: string
}

export interface Move {
    id: string
    room_code: string
    player_id: string
    word_played: string | null
    points_scored: number
    move_type: 'word' | 'skip' | 'swap' | 'end_game'
    move_details: any | null
    created_at: string
}

// Helper function to generate unique 5-character room code
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}
