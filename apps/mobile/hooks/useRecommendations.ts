import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AgentEvent, MealRecommendation } from '@whats-for-dinner/types'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export function useRecommendations() {
    const [events, setEvents] = useState<AgentEvent[]>([])
    const [recommendations, setRecommendations] = useState<MealRecommendation[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const generate = useCallback(async (prompt: string) => {
        setLoading(true)
        setEvents([])
        setRecommendations([])
        setError('')

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Not authenticated')

            const url = `${API_URL}/api/recommendations/stream?prompt=${encodeURIComponent(prompt)}`
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })

            if (!response.body) throw new Error('No response body')

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const event: AgentEvent = JSON.parse(line.slice(6))
                            setEvents(prev => [...prev, event])

                            if (event.type === 'recommendation') {
                                const recs = Array.isArray(event.payload)
                                    ? event.payload
                                    : [event.payload]
                                setRecommendations(recs)
                            }

                            if (event.type === 'done') setLoading(false)
                            if (event.type === 'error') {
                                setError(event.payload?.error ?? 'Something went wrong')
                                setLoading(false)
                            }
                        } catch {}
                    }
                }
            }
        } catch (e: any) {
            setError(e.message)
            setLoading(false)
        }
    }, [])

    return { generate, events, recommendations, loading, error }
}