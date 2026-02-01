import { Player } from '@/lib/supabase'

interface CurrentTurnProps {
    player: Player
}

export default function CurrentTurn({ player }: CurrentTurnProps) {
    return (
        <div className="relative overflow-hidden rounded-lg p-6 bg-gradient-primary shadow-lg">
            {/* Crown Icon */}
            <div className="flex justify-center mb-2">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            </div>

            {/* Text */}
            <div className="text-center">
                <p className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                    Current Turn
                </p>
                <p className="text-3xl font-bold text-white border-b-4 border-white inline-block pb-1">
                    {player.name}
                </p>
            </div>

            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
        </div>
    )
}
