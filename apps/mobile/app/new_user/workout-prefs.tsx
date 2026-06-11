import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import {apiCall} from "../../lib/api";
import {FITNESS_GOALS, UserContext, WORKOUT_TYPES} from "@whats-for-dinner/types";

const DAYS_OPTIONS = ['1', '2', '3', '4', '5', '6', '7'] as const


export default function WorkoutPrefs() {
    const [days, setDays] = useState<number>(4)
    const [sessionMins, setSessionMins] = useState<UserContext['workoutSessionMin']>(45)
    const [workoutTypes, setWorkoutTypes] = useState<string[]>([])
    const [fitnessGoals, setFitnessGoals] = useState<string[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState<boolean>(false)
    const router = useRouter()

    const toggleType = (t: string) => {
        setWorkoutTypes(workoutTypes.includes(t) ? workoutTypes.filter(x => x !== t) : [...workoutTypes, t])
    }

    const toggleGoal = (g: string) => {
        setFitnessGoals(fitnessGoals.includes(g)
            ? fitnessGoals.filter(x => x !== g)
            : [...fitnessGoals, g]
        )
    }

    const handleFinish = async () => {
        if (!days || !fitnessGoals) {
            setError('Please select days per week and a fitness goal')
            return
        }

        try {
            setLoading(true)
            await apiCall('/api/profile/workout-prefs', {
                workoutDaysPerWeek: days,
                workoutSessionMin: sessionMins,
                preferredWorkoutTypes: workoutTypes,
                fitnessGoalDetail: fitnessGoals
            })
            router.replace('/(tabs)')
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }

    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Workout preferences</Text>

            <Text style={styles.label}>Days per week</Text>
            <View style={styles.chips}>
                {DAYS_OPTIONS.map(d => (
                    <TouchableOpacity
                        key={d}
                        style={[styles.dayChip, String(days) === d && styles.chipSelected]}
                        onPress={() => setDays(parseInt(d))}
                    >
                        <Text style={[styles.chipText, String(days) === d && styles.chipTextSelected]}>{d}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Session length (minutes)</Text>
            <TextInput
                style={styles.input}
                value={String(sessionMins)}
                onChangeText={(text) => setSessionMins(Number(text))}
                keyboardType="numeric"
                placeholder="45"
            />

            <Text style={styles.label}>Preferred workout types</Text>
            <View style={styles.chips}>
                {WORKOUT_TYPES.map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.chip, workoutTypes.includes(t) && styles.chipSelected]}
                        onPress={() => toggleType(t)}
                    >
                        <Text style={[styles.chipText, workoutTypes.includes(t) && styles.chipTextSelected]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Fitness goal</Text>
            {FITNESS_GOALS.map(g => (
                <TouchableOpacity
                    key={g}
                    style={[styles.option, fitnessGoals.includes(g) && styles.selected]}
                    onPress={() => toggleGoal(g)}
                >
                    <Text style={[styles.optionText, fitnessGoals.includes(g) && styles.selectedText]}>
                        {g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Text>
                </TouchableOpacity>
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleFinish}
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
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15 },
    option: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 8 },
    selected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    optionText: { fontSize: 15, color: '#333' },
    selectedText: { color: '#16a34a', fontWeight: '600' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    dayChip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    chipSelected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    chipText: { fontSize: 14, color: '#333' },
    chipTextSelected: { color: '#16a34a', fontWeight: '600' },
    button: { backgroundColor: '#16a34a', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 32, marginBottom: 40 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    error: { color: 'red', marginTop: 12, textAlign: 'center' },
    buttonDisabled: { backgroundColor: '#86efac' }
})