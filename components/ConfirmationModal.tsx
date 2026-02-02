import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    // Use portal to render at document root level
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 md:p-6 pb-2">
                    <h3 className={`text-xl font-bold ${isDanger ? 'text-red-400' : 'text-white'}`}>
                        {title}
                    </h3>
                </div>

                {/* Body */}
                <div className="px-4 md:px-6 py-2">
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 pt-4 flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 border border-white/10 
                            ${isDanger
                                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
                                : 'bg-gradient-primary'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
