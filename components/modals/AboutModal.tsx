'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface AboutModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    if (!isOpen) return null
    if (typeof document === 'undefined') return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl max-h-[85vh] bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            About
                        </h2>
                        <div className="h-1 w-16 bg-gradient-primary rounded-full mt-2" />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                    <div className="space-y-6 text-gray-300 leading-relaxed">
                        <section>
                            <h3 className="text-xl font-semibold text-white mb-3">Why This App Exists</h3>
                            <div className="space-y-3 text-sm md:text-base">
                                <p>
                                    Playing Scrabble is fun. Keeping score manually? Not so much.
                                </p>
                                <p>
                                    Every game night, someone has to write down scores on paper. You have to add up
                                    letter points, remember which tiles hit the double or triple squares, and keep
                                    a running total for each player. It's easy to make mistakes, and arguments happen
                                    when the math doesn't add up.
                                </p>
                                <p>
                                    This app solves that problem. Instead of pen and paper, everyone can see the
                                    scores update in real-time on their phones or computers. No more math errors,
                                    no more disputes, and no more interrupting the game to figure out who's winning.
                                </p>
                                <p className="text-primary font-semibold">
                                    Just play Scrabble. We'll handle the numbers.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold text-white mb-3">What This App Does</h3>
                            <p className="text-sm md:text-base">
                                <strong className="text-primary">Scrabble Score Tracker</strong> is a free tool
                                that keeps track of scores during your Scrabble games. Everyone in the game can
                                see the same information at the same time.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-semibold text-white mb-3">Key Features</h3>
                            <ul className="space-y-2 text-sm md:text-base">
                                <li className="flex items-start gap-3">
                                    <span className="text-primary text-xl flex-shrink-0">•</span>
                                    <div>
                                        <strong className="text-white">Real-time Updates:</strong> Everyone sees
                                        score changes instantly
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary text-xl flex-shrink-0">•</span>
                                    <div>
                                        <strong className="text-white">Word Builder:</strong> Build words with
                                        tiles and multipliers (double letter, triple word, etc.)
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary text-xl flex-shrink-0">•</span>
                                    <div>
                                        <strong className="text-white">Automatic Scoring:</strong> The app
                                        calculates points for you, including the 50-point bonus for using all 7 tiles
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary text-xl flex-shrink-0">•</span>
                                    <div>
                                        <strong className="text-white">Multiple Words Per Turn:</strong> Add
                                        several words before ending your turn
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary text-xl flex-shrink-0">•</span>
                                    <div>
                                        <strong className="text-white">Host Controls:</strong> The game creator
                                        can undo mistakes or delete the room
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-primary text-xl flex-shrink-0">•</span>
                                    <div>
                                        <strong className="text-white">Game History:</strong> See the last 20
                                        words played and their scores
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <div className="pt-4 border-t border-white/10">
                            <p className="text-xs text-white/50 italic text-center">
                                Built to make Scrabble nights more enjoyable and less about math.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
