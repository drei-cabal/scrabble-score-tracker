import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/ui/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Scrabble Score Tracker',
    description: 'Real-time Scrabble score tracking competition dashboard',
    icons: {
        icon: '/icon.png',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} flex flex-col min-h-screen`}>
                <main className="flex-1">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    )
}
