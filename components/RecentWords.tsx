import { Move, Player } from '@/lib/supabase'

interface RecentWordsProps {
    moves: Move[]
    players: Player[]
}

export default function RecentWords({ moves, players }: RecentWordsProps) {
    const getPlayerName = (playerId: string) => {
        const player = players.find((p) => p.id === playerId)
        return player?.name || 'Unknown'
    }

    const getMoveDisplay = (move: Move) => {
        switch (move.move_type) {
            case 'word':
                return {
                    text: move.word_played || '',
                    icon: '📝',
                    color: 'text-white',
                }
            case 'skip':
                return {
                    text: 'SKIPPED TURN',
                    icon: '⏭️',
                    color: 'text-yellow-400',
                }
            case 'swap':
                return {
                    text: 'SWAPPED TILES',
                    icon: '🔄',
                    color: 'text-blue-400',
                }
            default:
                return {
                    text: '',
                    icon: '❓',
                    color: 'text-gray-400',
                }
        }
    }

    return (
        <div className="card h-full">
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                <h2 className="text-xl font-bold">Recent Words</h2>
            </div>

            <div className="space-y-3 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {moves.length === 0 ? (
                    <p className="text-text-muted text-center py-8">No moves yet. Start playing!</p>
                ) : (
                    moves.map((move) => {
                        const display = getMoveDisplay(move)
                        return (
                            <div key={move.id} className="word-card">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{display.icon}</span>
                                    <div>
                                        <p className={`font-bold text-lg ${display.color}`}>
                                            {display.text}
                                        </p>
                                        <p className="text-sm text-text-muted">
                                            by {getPlayerName(move.player_id)}
                                        </p>
                                    </div>
                                </div>
                                {move.move_type === 'word' && (
                                    <span className="text-primary text-xl font-bold">
                                        +{move.points_scored}
                                    </span>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
