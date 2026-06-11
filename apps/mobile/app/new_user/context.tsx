import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import {COOKING_EQUIPMENT, COOKING_SKILLS, UserContext} from '@whats-for-dinner/types'
import {apiCall} from "../../lib/api";


export default function Context() {
    const [weekdayMins, setWeekdayMins] = useState<UserContext['weekdayCookMin']>(30)
    const [weekendMins, setWeekendMins] = useState<UserContext['weekendCookMin']>(60)
    const [weeklyBudget, setWeeklyBudget] = useState<UserContext['weeklyBudgetUsd']>(75)
    const [skill, setSkill] = useState<UserContext['cookingSkill'] | ''>('')
    const [equipment, setEquipment] = useState<string[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const toggleEquipment = (item: string) => {
        setEquipment(equipment.includes(item) ? equipment.filter(x => x !== item) : [...equipment, item])
    }

    const handleNext = async () => {
        if (!skill) { setError('Please select a cooking skill level'); return }

        try {
            setLoading(true)
            await apiCall('/api/profile/context', {
                weekdayCookMin: weekdayMins,
                weekendCookMin: weekendMins,
                weeklyBudgetUsd: weeklyBudget ? weeklyBudget : null,
                cookingSkill: skill,
                equipment
            })
            router.push('/(onboarding)/workout-prefs')
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Cooking preferences</Text>

            <Text style={styles.label}>Weekday cooking time (minutes)</Text>
            <TextInput
                style={styles.input}
                value={String(weekdayMins)}
                onChangeText={(text) => setWeekdayMins(Number(text))}
                keyboardType="numeric"
                placeholder="30"
            />

            <Text style={styles.label}>Weekend cooking time (minutes)</Text>
            <TextInput
                style={styles.input}
                value={String(weekendMins)}
                onChangeText={(text) => setWeekendMins(Number(text))}
                keyboardType="numeric"
                placeholder="60"
            />

            <Text style={styles.label}>Weekly grocery budget (USD, optional)</Text>
            <TextInput
                style={styles.input}
                value={String(weeklyBudget)}
                onChangeText={(text) => setWeeklyBudget(Number(text))}
                keyboardType="decimal-pad"
                placeholder="e.g. 100"
            />

            <Text style={styles.label}>Cooking skill</Text>
            {COOKING_SKILLS.map(s => (
                <TouchableOpacity
                    key={s}
                    style={[styles.option, skill === s && styles.selected]}
                    onPress={() => setSkill(s)}
                >
                    <Text style={[styles.optionText, skill === s && styles.selectedText]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}

            <Text style={styles.label}>Available equipment</Text>
            <View style={styles.chips}>
                {COOKING_EQUIPMENT.map(e => (
                    <TouchableOpacity
                        key={e}
                        style={[styles.chip, equipment.includes(e) && styles.chipSelected]}
                        onPress={() => toggleEquipment(e)}
                    >
                        <Text style={[styles.chipText, equipment.includes(e) && styles.chipTextSelected]}>
                            {e.replace('_', ' ')}
                        </Text>
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
    label: { fontSize: 15, fontWeight: '600', marginTop: 20, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 4 },
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