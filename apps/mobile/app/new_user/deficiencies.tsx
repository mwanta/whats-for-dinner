import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import {apiCall} from "../../lib/api";
import {Deficiency, NUTRIENTS, SEVERITIES} from "@whats-for-dinner/types";

export default function Deficiencies() {
    const [entries, setEntries] = useState<Deficiency[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const toggleNutrient = (nutrient: string) => {
        if (entries.find(e => e.nutrient === nutrient)) {
            setEntries(entries.filter(e => e.nutrient !== nutrient))
        } else {
            setEntries([...entries, { nutrient, severity: 'mild' }])
        }
    }

    const setSeverity = (nutrient: string, severity: Deficiency['severity']) => {
        setEntries(entries.map(e => e.nutrient === nutrient ? { ...e, severity } : e))
    }

    const handleNext = async () => {

        if (entries.length > 0) {
            try {
                setLoading(true)
                await apiCall('/api/profile/deficiencies', { deficiencies: entries })
                router.push('/(onboarding)/injuries')
            } catch (e: any) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Known deficiencies</Text>
            <Text style={styles.subtitle}>
                Select any nutrients you know you're low on. This helps the agent prioritize foods that address your gaps.
            </Text>

            {NUTRIENTS.map(({ key, label }) => {
                const entry = entries.find(e => e.nutrient === key)
                const selected = !!entry
                return (
                    <View key={key} style={styles.nutrientBlock}>
                        <TouchableOpacity
                            style={[styles.option, selected && styles.selected]}
                            onPress={() => toggleNutrient(key)}
                        >
                            <Text style={[styles.optionText, selected && styles.selectedText]}>{label}</Text>
                        </TouchableOpacity>
                        {selected && (
                            <View style={styles.severityRow}>
                                {SEVERITIES.map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.severityChip, entry.severity === s && styles.severitySelected]}
                                        onPress={() => setSeverity(key, s)}
                                    >
                                        <Text style={[styles.severityText, entry.severity === s && styles.severityTextSelected]}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )
            })}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Next'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skip} onPress={() => router.push('/(onboarding)/injuries')}>
                <Text style={styles.skipText}>Skip — no known deficiencies</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
    nutrientBlock: { marginBottom: 8 },
    option: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14 },
    selected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    optionText: { fontSize: 15, color: '#333' },
    selectedText: { color: '#16a34a', fontWeight: '600' },
    severityRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingLeft: 4 },
    severityChip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
    severitySelected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    severityText: { fontSize: 13, color: '#333' },
    severityTextSelected: { color: '#16a34a', fontWeight: '600' },
    button: { backgroundColor: '#16a34a', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 32 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    skip: { alignItems: 'center', marginTop: 16, padding: 8 },
    skipText: { color: '#888', fontSize: 14 },
    error: { color: 'red', marginTop: 12, textAlign: 'center' },
    buttonDisabled: { backgroundColor: '#86efac' }
})