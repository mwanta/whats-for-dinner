import { useState } from 'react'
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StyleSheet, ActivityIndicator
} from 'react-native'
import type { MealRecommendation } from '@whats-for-dinner/types'
import { useRecommendations } from '../../hooks/useRecommendations'

const QUICK_PROMPTS = [
    'Suggest dinners for this week',
    'High protein vegan meals under 30 minutes',
    'Meals that complete my amino acid profile',
    'Budget-friendly meal plan for the week'
]

export default function Recommendations() {
    const [prompt, setPrompt] = useState('')
    const { generate, events, recommendations, loading, error } = useRecommendations()

    const handleGenerate = (text?: string) => {
        generate(text ?? prompt)
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Discover Meals</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickPrompts}>
                {QUICK_PROMPTS.map(p => (
                    <TouchableOpacity
                        key={p}
                        style={styles.quickChip}
                        onPress={() => handleGenerate(p)}
                    >
                        <Text style={styles.quickChipText}>{p}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={prompt}
                    onChangeText={setPrompt}
                    placeholder="Ask anything about your meal plan..."
                    multiline
                />
                <TouchableOpacity
                    style={[styles.generateButton, (loading || !prompt.trim()) && styles.buttonDisabled]}
                    onPress={() => handleGenerate()}
                    disabled={loading || !prompt.trim()}
                >
                    <Text style={styles.generateButtonText}>Go</Text>
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color="#16a34a" />
                    <Text style={styles.thinkingText}>
                        {events.filter(e => e.type === 'thinking').slice(-1)[0]?.payload ?? 'Thinking...'}
                    </Text>
                </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {recommendations.map((rec: MealRecommendation, i) => (
                <View key={i} style={styles.recCard}>
                    <Text style={styles.recName}>{rec.name}</Text>

                    {rec.reasoning && (
                        <Text style={styles.recReasoning}>{rec.reasoning}</Text>
                    )}

                    {rec.eaaContribution && rec.eaaContribution.length > 0 && (
                        <View style={styles.eaaRow}>
                            {rec.eaaContribution.map((eaa: string) => (
                                <View key={eaa} style={styles.eaaBadge}>
                                    <Text style={styles.eaaBadgeText}>{eaa}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {rec.complementaryMeals && rec.complementaryMeals.length > 0 && (
                        <Text style={styles.complementary}>
                            Pairs well with: {rec.complementaryMeals.join(', ')}
                        </Text>
                    )}

                    {rec.workoutSynergy && (
                        <Text style={styles.synergy}>💪 {rec.workoutSynergy}</Text>
                    )}

                    <Text style={styles.macros}>
                        {rec.calories} cal · {rec.protein_g}g protein · {rec.carbs_g}g carbs · {rec.fat_g}g fat · {rec.fiber_g}g fiber
                    </Text>

                    <TouchableOpacity style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>+ Save to Plan</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
    quickPrompts: { marginBottom: 16 },
    quickChip: {
        borderWidth: 1, borderColor: '#16a34a', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8, marginRight: 8
    },
    quickChipText: { color: '#16a34a', fontSize: 13 },
    inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    input: {
        flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
        padding: 12, fontSize: 15, minHeight: 48
    },
    generateButton: {
        backgroundColor: '#16a34a', borderRadius: 8,
        paddingHorizontal: 20, justifyContent: 'center'
    },
    generateButtonText: { color: '#fff', fontWeight: '600' },
    buttonDisabled: { backgroundColor: '#86efac' },
    thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    thinkingText: { color: '#666', fontSize: 14 },
    error: { color: 'red', marginBottom: 16 },
    recCard: {
        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
        padding: 16, marginBottom: 16
    },
    recName: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
    recReasoning: { color: '#555', fontSize: 14, marginBottom: 10, lineHeight: 20 },
    eaaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    eaaBadge: {
        backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac',
        borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4
    },
    eaaBadgeText: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
    complementary: { color: '#666', fontSize: 13, marginBottom: 8, fontStyle: 'italic' },
    synergy: { color: '#555', fontSize: 13, marginBottom: 10 },
    macros: { color: '#888', fontSize: 13, marginBottom: 12 },
    saveButton: {
        borderWidth: 1, borderColor: '#16a34a',
        borderRadius: 8, padding: 10, alignItems: 'center'
    },
    saveButtonText: { color: '#16a34a', fontWeight: '600' }
})