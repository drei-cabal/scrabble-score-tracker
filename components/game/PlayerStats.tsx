export default function PlayerStats() {
    // Placeholder stats - would require additional database tables for real implementation
    const stats = {
        games: 124,
        wins: 45,
        avgPoints: 187,
    }

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-4">Your Stats</h2>

            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{stats.games}</p>
                    <p className="text-sm text-text-muted">Games</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{stats.wins}</p>
                    <p className="text-sm text-text-muted">Wins</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{stats.avgPoints}</p>
                    <p className="text-sm text-text-muted">Avg Pts</p>
                </div>
            </div>

            <div className="mt-4 p-3 bg-secondary rounded-lg">
                <p className="text-xs text-text-muted text-center">
                    💡 Stats are placeholder values for UI demonstration
                </p>
            </div>
        </div>
    )
}
