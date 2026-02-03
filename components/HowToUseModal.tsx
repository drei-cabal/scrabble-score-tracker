'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface HowToUseModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function HowToUseModal({ isOpen, onClose }: HowToUseModalProps) {
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
                            How To Use
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
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-sm font-bold flex-shrink-0">1</span>
                                Getting Started
                            </h3>
                            <ul className="space-y-1.5 ml-10 text-sm">
                                <li><strong className="text-white">Create a Room:</strong> Enter your name and click "Create Room"</li>
                                <li><strong className="text-white">Join a Room:</strong> Enter the 4-character room code and your name, then click "Join Room"</li>
                                <li><strong className="text-white">Spectate:</strong> Check the "Join as spectator" box to watch without playing</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-sm font-bold flex-shrink-0">2</span>
                                Understanding the Interface
                            </h3>
                            <ul className="space-y-1.5 ml-10 text-sm">
                                <li><strong className="text-white">Current Turn:</strong> Shows whose turn it is (highlighted in orange)</li>
                                <li><strong className="text-white">Live Leaderboard:</strong> Real-time player rankings and scores</li>
                                <li><strong className="text-white">Recent Words:</strong> History of the last 20 moves with points</li>
                                <li><strong className="text-white">Construct Your Turn:</strong> Your scoring interface (only visible on your turn)</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-sm font-bold flex-shrink-0">3</span>
                                Using the Word Builder
                            </h3>
                            <ul className="space-y-1.5 ml-10 text-sm">
                                <li><strong className="text-white">Type Your Word:</strong> Enter letters in the input field</li>
                                <li><strong className="text-white">Add Tiles:</strong> Click "Add Tile" to create draggable letter tiles</li>
                                <li><strong className="text-white">Apply Multipliers:</strong> Drag tiles onto multiplier zones:
                                    <ul className="ml-6 mt-1 space-y-0.5 text-xs">
                                        <li>• <span className="text-blue-400">DL</span> = Double Letter Score</li>
                                        <li>• <span className="text-blue-600">TL</span> = Triple Letter Score</li>
                                        <li>• <span className="text-pink-400">DW</span> = Double Word Score</li>
                                        <li>• <span className="text-red-400">TW</span> = Triple Word Score</li>
                                    </ul>
                                </li>
                                <li><strong className="text-white">Blank Tiles:</strong> Use "*" for blank tiles (0 points, but can be placed on multipliers)</li>
                                <li><strong className="text-white">Score Display:</strong> Points are calculated automatically as you build</li>
                                <li><strong className="text-white">Add to Turn:</strong> Click "Add Word to Turn" to save the word to your turn buffer</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-sm font-bold flex-shrink-0">4</span>
                                Turn Buffer (Multiple Words)
                            </h3>
                            <ul className="space-y-1.5 ml-10 text-sm">
                                <li>Add multiple words before ending your turn</li>
                                <li>Remove words from the buffer by clicking the X button</li>
                                <li>Total score is displayed at the bottom</li>
                                <li>Click "END TURN" to submit all words at once</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-sm font-bold flex-shrink-0">5</span>
                                Other Actions
                            </h3>
                            <ul className="space-y-1.5 ml-10 text-sm">
                                <li><strong className="text-white">Skip Turn:</strong> Pass your turn without scoring (confirmation required)</li>
                                <li><strong className="text-white">Swap Tiles:</strong> Exchange tiles without scoring (confirmation required)</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-400 text-sm font-bold flex-shrink-0">!</span>
                                Host Controls
                            </h3>
                            <ul className="space-y-1.5 ml-10 text-sm">
                                <li><strong className="text-white">Undo Last Move:</strong> Revert the most recent turn (reverts score and turn order)</li>
                                <li><strong className="text-white">Delete Room:</strong> Permanently delete the game room (top-right button)</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-white border border-white/20 text-sm font-bold flex-shrink-0">i</span>
                                Data Retention Policy
                            </h3>
                            <div className="bg-secondary/50 p-3 rounded-lg border border-white/10 text-sm">
                                <p className="mb-2">To keep the application fast and responsive for everyone:</p>
                                <ul className="space-y-1 ml-5 list-disc text-text-muted">
                                    <li>Game rooms are temporary.</li>
                                    <li>Rooms created more than <strong>48 hours ago</strong> are automatically deleted.</li>
                                    <li>All associated moves, scores, and player data will be permanently removed.</li>
                                </ul>
                            </div>
                        </section>

                        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-xs text-blue-200">
                                <strong>💡 Pro Tip:</strong> The app syncs in real-time, so all players see updates
                                within seconds. No need to refresh!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
