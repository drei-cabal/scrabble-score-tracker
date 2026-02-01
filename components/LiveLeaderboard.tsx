import { Player } from '@/lib/supabase'

interface LiveLeaderboardProps {
    players: Player[]
}

export default function LiveLeaderboard({ players }: LiveLeaderboardProps) {
    // Filter only actual players (not spectators) and sort by score
    const rankedPlayers = players
        .filter((p) => p.role === 'player')
        .sort((a, b) => b.total_score - a.total_score)

    const getRankIcon = (index: number) => {
        const icons = ['🏆', '🥈', '🥉', '4']
        return icons[index] || index + 1
    }

    return (
        <div className="card">
            <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h2 className="text-xl font-bold">Live Leaderboard</h2>
            </div>

            <div className="space-y-2">
                {rankedPlayers.length === 0 ? (
                    <p className="text-text-muted text-center py-4">No players yet</p>
                ) : (
                    rankedPlayers.map((player, index) => (
                        <div
                            key={player.id}
                            className={`leaderboard-item ${index === 0 ? 'leaderboard-item-first' : 'leaderboard-item-other'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getRankIcon(index)}</span>
                                <span className="font-semibold">{player.name}</span>
                            </div>
                            <span className="text-2xl font-bold">{player.total_score}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Spectators Section */}
            {players.filter((p) => p.role === 'spectator').length > 0 && (
                <div className="mt-4 pt-4 border-t border-secondary">
                    <p className="text-sm text-text-muted mb-2">Spectators:</p>
                    <div className="flex flex-wrap gap-2">
                        {players
                            .filter((p) => p.role === 'spectator')
                            .map((spectator) => (
                                <span
                                    key={spectator.id}
                                    className="px-3 py-1 bg-secondary rounded-full text-sm"
                                >
                                    {spectator.name}
                                </span>
                            ))}
                    </div>
                </div>
            )}
        </div>
    )
}
