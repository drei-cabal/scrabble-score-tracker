export interface QueuedMove {
    id: string
    type: 'submit' | 'skip' | 'swap'
    payload: any
    timestamp: number
}

const QUEUE_KEY = 'scrabble_offline_queue'

export const offlineQueue = {
    add: (type: 'submit' | 'skip' | 'swap', payload: any) => {
        const queue = offlineQueue.get()
        const newMove: QueuedMove = {
            id: crypto.randomUUID(),
            type,
            payload,
            timestamp: Date.now()
        }
        queue.push(newMove)
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
        return newMove
    },

    get: (): QueuedMove[] => {
        if (typeof window === 'undefined') return []
        const stored = localStorage.getItem(QUEUE_KEY)
        return stored ? JSON.parse(stored) : []
    },

    remove: (id: string) => {
        const queue = offlineQueue.get()
        const filtered = queue.filter(m => m.id !== id)
        localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered))
    },

    clear: () => {
        localStorage.removeItem(QUEUE_KEY)
    },

    sync: async () => {
        const queue = offlineQueue.get()
        if (queue.length === 0) return

        const sorted = queue.sort((a, b) => a.timestamp - b.timestamp)
        const failed: QueuedMove[] = []

        for (const move of sorted) {
            try {
                let endpoint = ''
                if (move.type === 'submit') endpoint = '/api/moves/submit'
                else if (move.type === 'skip') endpoint = '/api/moves/skip'
                else if (move.type === 'swap') endpoint = '/api/moves/swap'

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(move.payload)
                })

                if (!res.ok) throw new Error('Sync failed')

                // If successful, remove from queue (by not adding to failed)
            } catch (err) {
                console.error('Failed to sync move:', move, err)
                failed.push(move) // Keep in queue to retry later
            }
        }

        if (failed.length > 0) {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(failed))
        } else {
            localStorage.removeItem(QUEUE_KEY)
        }
    }
}
