'use client'

import { useEffect, useState } from 'react'

interface TurnTimerProps {
    turnStartedAt: string | null
    turnTimerSeconds: number
    isPaused?: boolean
    onTimeExpired: () => void
}

export default function TurnTimer({ turnStartedAt, turnTimerSeconds, isPaused = false, onTimeExpired }: TurnTimerProps) {
    const [remainingSeconds, setRemainingSeconds] = useState<number>(turnTimerSeconds)
    const [hasExpired, setHasExpired] = useState(false)

    useEffect(() => {
        if (!turnStartedAt || isPaused) {
            // Don't run timer if paused
            if (!turnStartedAt) {
                setRemainingSeconds(turnTimerSeconds)
                setHasExpired(false)
            }
            return
        }

        // Calculate remaining time based on server timestamp
        const calculateRemaining = () => {
            const startTime = new Date(turnStartedAt).getTime()
            const now = Date.now()
            const elapsed = (now - startTime) / 1000 // Convert to seconds
            const remaining = Math.max(0, turnTimerSeconds - elapsed)
            return remaining
        }

        // Update every 100ms for smooth countdown
        const interval = setInterval(() => {
            const remaining = calculateRemaining()
            setRemainingSeconds(remaining)

            if (remaining <= 0 && !hasExpired) {
                setHasExpired(true)
                onTimeExpired()
            }
        }, 100)

        // Initial calculation
        setRemainingSeconds(calculateRemaining())

        return () => clearInterval(interval)
    }, [turnStartedAt, turnTimerSeconds, isPaused, hasExpired, onTimeExpired])

    // Reset expired state when turn changes
    useEffect(() => {
        setHasExpired(false)
    }, [turnStartedAt])

    // Determine color based on remaining time
    const getColorClass = () => {
        // Using darker shades for contrast against bright orange background
        if (remainingSeconds > 10) return 'text-white' // or text-green-900, but white on orange is usually best for standard text.
        // Wait, standard text is usually white on orange. 'text-green-400' is light green.
        // If the user wants "dark", they likely mean dark grey/black?
        // Let's try deep colors.
        if (remainingSeconds > 10) return 'text-green-900' // Dark green
        if (remainingSeconds > 5) return 'text-yellow-900' // Dark yellow/brown
        return 'text-red-900 animate-pulse' // Dark red
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xl font-bold font-mono ${getColorClass()}`}>
                {formatTime(remainingSeconds)}
            </span>
        </div>
    )
}
