/**
 * The system prompt asks for a JSON array of meals. Models sometimes wrap it
 * in prose, so take the outermost [...] and fall back to the raw text.
 */
export function parseRecommendation(content: string | null | undefined): unknown {
    const text = content ?? ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return { text }
    try {
        return JSON.parse(match[0])
    } catch {
        return { text }
    }
}
