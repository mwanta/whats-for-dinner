import { useState } from 'react'
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import {ACTIVITY_LEVELS, GOALS, UserProfile} from '@whats-for-dinner/types'
import {apiCall} from "../../lib/api";

export default function Goals() {
    const [goal, setGoal] = useState<UserProfile['goal'] | ''>('')
    const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel'] | ''>('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleNext = async () => {
        if (!goal || !activityLevel) {
            setError('Please select both a goal and activity level')
            return
        }

        try {
            setLoading(true)
            await apiCall('/api/profile/goals', { goal, activityLevel })
            router.push('/(onboarding)/diet')
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>What's your goal?</Text>

            <Text style={styles.label}>Fitness Goal</Text>
            {GOALS.map(g => (
                <TouchableOpacity
                    key={g}
                    style={[styles.option, goal === g && styles.selected]}
                    onPress={() => setGoal(g)}
                >
                    <Text style={[styles.optionText, goal === g && styles.selectedText]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}

            <Text style={styles.label}>Activity Level</Text>
            {ACTIVITY_LEVELS.map(a => (
                <TouchableOpacity
                    key={a}
                    style={[styles.option, activityLevel === a && styles.selected]}
                    onPress={() => setActivityLevel(a)}
                >
                    <Text style={[styles.optionText, activityLevel === a && styles.selectedText]}>
                        {a.charAt(0).toUpperCase() + a.slice(1).replace('_', ' ')}
                    </Text>
                </TouchableOpacity>
            ))}

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
    button: { backgroundColor: '#16a34a', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 32 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    error: { color: 'red', marginTop: 12, textAlign: 'center' },
    buttonDisabled: { backgroundColor: '#86efac' }
})