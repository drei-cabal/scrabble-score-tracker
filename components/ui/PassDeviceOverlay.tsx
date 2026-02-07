'use client'

import { useEffect, useState } from 'react'

interface PassDeviceOverlayProps {
    isVisible: boolean
    nextPlayerName: string
    onReady: () => void
}

export default function PassDeviceOverlay({ isVisible, nextPlayerName, onReady }: PassDeviceOverlayProps) {
    if (!isVisible) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-primary/20 to-secondary border-2 border-primary rounded-2xl p-5 md:p-6 max-w-xs md:max-w-sm w-full text-center shadow-2xl">
                <div className="mb-3 md:mb-4">
                    <svg className="w-10 h-10 md:w-12 md:h-12 mx-auto text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </div>

                <h2 className="text-lg md:text-xl font-bold mb-1">Pass Device To</h2>
                <p className="text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4">{nextPlayerName}</p>

                <p className="text-text-muted text-xs md:text-sm mb-3 md:mb-4">Click Ready when you have the device.</p>

                <button
                    onClick={onReady}
                    className="btn-primary w-full py-2 md:py-2.5 text-sm md:text-base font-bold"
                >
                    Ready!
                </button>
            </div>
        </div>
    )
}
