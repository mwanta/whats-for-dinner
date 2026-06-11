import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import {apiCall} from "../../lib/api";
import {COMMON_ALLERGIES, CUISINES, DIET_TYPES, DietaryPreferences} from "@whats-for-dinner/types";


export default function Diet() {
    const [dietType, setDietType] = useState<DietaryPreferences['dietType'] | ''>('')
    const [allergies, setAllergies] = useState<DietaryPreferences['allergies']>([])
    const [cuisines, setCuisines] = useState<DietaryPreferences['cuisinePreferences']>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const toggle = (item: string, list: string[], setList: (l: string[]) => void) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
    }

    const handleNext = async () => {
        if (!dietType) { setError('Please select a diet type'); return }

        try {
            setLoading(true)
            await apiCall('/api/profile/diet', { dietType, allergies, cuisinePreferences: cuisines })
            router.push('/(onboarding)/diet')
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Dietary preferences</Text>

            <Text style={styles.label}>Diet Type</Text>
            {DIET_TYPES.map(d => (
                <TouchableOpacity
                    key={d}
                    style={[styles.option, dietType === d && styles.selected]}
                    onPress={() => setDietType(d)}
                >
                    <Text style={[styles.optionText, dietType === d && styles.selectedText]}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}

            <Text style={styles.label}>Allergies / Intolerances</Text>
            <View style={styles.chips}>
                {COMMON_ALLERGIES.map(a => (
                    <TouchableOpacity
                        key={a}
                        style={[styles.chip, allergies.includes(a) && styles.chipSelected]}
                        onPress={() => toggle(a, allergies, setAllergies)}
                    >
                        <Text style={[styles.chipText, allergies.includes(a) && styles.chipTextSelected]}>{a}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Cuisine Preferences</Text>
            <View style={styles.chips}>
                {CUISINES.map(c => (
                    <TouchableOpacity
                        key={c}
                        style={[styles.chip, cuisines.includes(c) && styles.chipSelected]}
                        onPress={() => toggle(c, cuisines, setCuisines)}
                    >
                        <Text style={[styles.chipText, cuisines.includes(c) && styles.chipTextSelected]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Next'}</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 10 },
    option: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 8 },
    selected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    optionText: { fontSize: 15, color: '#333' },
    selectedText: { color: '#16a34a', fontWeight: '600' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    chipSelected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    chipText: { fontSize: 14, color: '#333' },
    chipTextSelected: { color: '#16a34a', fontWeight: '600' },
    button: { backgroundColor: '#16a34a', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 32 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    error: { color: 'red', marginTop: 12, textAlign: 'center' },
    buttonDisabled: { backgroundColor: '#86efac' }
})