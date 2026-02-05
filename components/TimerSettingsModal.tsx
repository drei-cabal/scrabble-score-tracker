'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface TimerSettingsModalProps {
    isOpen: boolean
    currentSeconds: number
    onClose: () => void
    onUpdate: (seconds: number) => Promise<void>
}

export default function TimerSettingsModal({ isOpen, currentSeconds, onClose, onUpdate }: TimerSettingsModalProps) {
    const [seconds, setSeconds] = useState(currentSeconds)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null
    if (typeof document === 'undefined') return null

    const presets = [
        { label: '30s', value: 30 },
        { label: '1m', value: 60 },
        { label: '2m', value: 120 },
        { label: '3m', value: 180 },
        { label: '5m', value: 300 },
    ]

    const handleUpdate = async () => {
        if (seconds < 10 || seconds > 300) {
            setError('Timer must be between 10 and 300 seconds')
            return
        }

        setLoading(true)
        setError('')

        try {
            await onUpdate(seconds)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to update timer')
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60)
        const remainingSecs = secs % 60
        if (mins === 0) return `${remainingSecs}s`
        if (remainingSecs === 0) return `${mins}m`
        return `${mins}m ${remainingSecs}s`
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-xs md:max-w-sm bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 md:p-5 pb-2 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Adjust Timer
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 md:p-5">
                    {/* Current Timer Display */}
                    <div className="text-center mb-4">
                        <p className="text-xs md:text-sm text-gray-400 mb-1">Current Timer</p>
                        <p className="text-2xl md:text-3xl font-bold text-primary">{formatTime(seconds)}</p>
                    </div>

                    {/* Presets */}
                    <div className="mb-4">
                        <p className="text-xs md:text-sm text-gray-400 mb-2">Quick Presets</p>
                        <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => setSeconds(preset.value)}
                                    className={`py-1.5 md:py-2 px-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${seconds === preset.value
                                            ? 'bg-primary text-white'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Input */}
                    <div className="mb-4">
                        <label className="block text-xs md:text-sm text-gray-400 mb-2">
                            Custom (10-300 seconds)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="10"
                                max="300"
                                value={seconds}
                                onChange={(e) => setSeconds(parseInt(e.target.value) || 10)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm md:text-base text-white focus:outline-none focus:border-primary transition-colors"
                            />
                            <span className="text-sm text-gray-400">seconds</span>
                        </div>
                    </div>

                    {/* Slider */}
                    <div className="mb-4">
                        <input
                            type="range"
                            min="10"
                            max="300"
                            step="10"
                            value={seconds}
                            onChange={(e) => setSeconds(parseInt(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>10s</span>
                            <span>5m</span>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs md:text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="mb-4 p-2 md:p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-300">
                            ⓘ Changing the timer will reset the current turn's countdown.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-5 pt-0 flex gap-2 md:gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="flex-1 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 border border-white/10 bg-gradient-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Updating...' : 'Update Timer'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--color-primary);
                    cursor: pointer;
                }
                .slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--color-primary);
                    cursor: pointer;
                    border: none;
                }
            `}</style>
        </div>,
        document.body
    )
}
