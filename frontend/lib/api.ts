import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function apiCall(path: string, body: object) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No session')

    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Request failed')
    return data
}