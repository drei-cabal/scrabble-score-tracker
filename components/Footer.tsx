export default function Footer() {
    return (
        <footer className="w-full bg-card border-t border-white/10 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                    {/* Left: Copyright */}
                    <div className="text-text-muted text-sm order-2 sm:order-1">
                        © 2026 Scrabble Score Tracker
                    </div>

                    {/* Center: Tagline */}
                    <div className="text-center text-sm font-medium text-gradient order-1 sm:order-2">
                        "May the best wordsmith win."
                    </div>

                    {/* Right: Author */}
                    <div className="text-text-muted text-sm text-center sm:text-right order-3">
                        by <span className="text-primary font-semibold">C.A.C</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
