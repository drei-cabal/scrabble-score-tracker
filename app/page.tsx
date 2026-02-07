
import { Suspense } from 'react'
import HomeDashboard from '@/components/game/HomeDashboard'

export default function Home() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="inline-block mb-4">
                        <svg className="w-16 h-16 text-primary animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm13 0h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v3h-3v-3z" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-text-muted">Loading Scrabble...</p>
                </div>
            </div>
        }>
            <HomeDashboard />
        </Suspense>
    )
}
