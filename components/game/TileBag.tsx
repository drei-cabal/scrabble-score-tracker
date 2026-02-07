'use client'

interface TileBagProps {
    bag: Record<string, number>
}

export default function TileBag({ bag }: TileBagProps) {
    // Calculate total remaining
    const totalTiles = Object.values(bag).reduce((sum, count) => sum + count, 0)

    return (
        <div className="card p-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-bold leading-tight">Total Tiles Remaining</h2>
                    <p className="text-2xl font-bold text-primary mt-1">{totalTiles}</p>
                </div>
            </div>
        </div>
    )
}
