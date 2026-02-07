'use client'
import { useState } from 'react'

interface ShareButtonProps {
    roomCode: string
    variant?: 'primary' | 'secondary' | 'icon' | 'ghost'
    className?: string
}

export default function ShareButton({ roomCode, variant = 'primary', className = '' }: ShareButtonProps) {
    const [justCopied, setJustCopied] = useState(false)

    const handleShare = async () => {
        // Construct URL: origin + /?code=ROOMCODE
        const url = `${window.location.origin}/?code=${roomCode}`

        // Try native share first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Scrabble Game',
                    text: `Join my Scrabble game! Room Code: ${roomCode}`,
                    url
                })
                return
            } catch (err) {
                // Ignore abort errors, fall through to clipboard
            }
        }

        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(url)
            setJustCopied(true)
            setTimeout(() => setJustCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy', err)
        }
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={handleShare}
                className={`p-2 rounded hover:bg-white/10 relative transition-colors ${className}`}
                title="Share Room Link"
            >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {justCopied && (
                    <span className="absolute top-full right-0 mt-1 px-2 py-1 bg-black text-white text-xs rounded shadow z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-1">
                        Copied!
                    </span>
                )}
            </button>
        )
    }

    return (
        <button
            onClick={handleShare}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${variant === 'primary' ? 'bg-primary hover:bg-primary-dark text-white' :
                    variant === 'secondary' ? 'bg-white/10 hover:bg-white/20 text-white' :
                        'hover:bg-white/10 text-white/80'
                } ${className}`}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-sm font-medium">{justCopied ? 'Link Copied!' : 'Share'}</span>
        </button>
    )
}
