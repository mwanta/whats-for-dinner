import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import {apiCall} from "../../lib/api";
import {BODY_PARTS, Injury, INJURY_TYPES, RESTRICTIONS} from "@whats-for-dinner/types";

export default function Injuries() {
    const [injuries, setInjuries] = useState<Omit<Injury, 'id'>[]>([])
    const [adding, setAdding] = useState(false)
    const [current, setCurrent] = useState<Partial<Omit<Injury, 'id'>>>({ restrictions: [] })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const toggleRestriction = (r: string) => {
        const list = current.restrictions ?? []
        setCurrent({
            ...current,
            restrictions: list.includes(r) ? list.filter(x => x !== r) : [...list, r]
        })
    }

    const addInjury = () => {
        if (!current.bodyPart || !current.injuryType) {
            setError('Please fill in all injury fields')
            return
        }
        setInjuries([...injuries, current as Injury])
        setCurrent({ restrictions: [] })
        setAdding(false)
        setError('')
    }

    const handleNext = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (injuries.length > 0) {
            try {
                setLoading(true)
                await apiCall('/api/profile/injuries', { injuries })
                router.push('/(onboarding)/context')
            } catch (e: any) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Injuries & restrictions</Text>
            <Text style={styles.subtitle}>
                Add any active injuries or physical limitations so workouts and nutrition can be tailored safely.
            </Text>

            {injuries.map((inj, i) => (
                <View key={i} style={styles.injuryCard}>
                    <Text style={styles.injuryCardTitle}>{inj.bodyPart}</Text>
                    <Text style={styles.injuryCardSub}>{inj.injuryType}</Text>
                    {inj.restrictions.length > 0 && (
                        <Text style={styles.injuryCardSub}>{inj.restrictions.join(', ')}</Text>
                    )}
                </View>
            ))}

            {adding ? (
                <View style={styles.addForm}>
                    <Text style={styles.label}>Body Part</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {BODY_PARTS.map(b => (
                            <TouchableOpacity
                                key={b}
                                style={[styles.chip, current.bodyPart === b && styles.chipSelected]}
                                onPress={() => setCurrent({ ...current, bodyPart: b })}
                            >
                                <Text style={[styles.chipText, current.bodyPart === b && styles.chipTextSelected]}>{b}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Type</Text>
                    <View style={styles.chips}>
                        {INJURY_TYPES.map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.chip, current.injuryType === t && styles.chipSelected]}
                                onPress={() => setCurrent({ ...current, injuryType: t })}
                            >
                                <Text style={[styles.chipText, current.injuryType === t && styles.chipTextSelected]}>
                                    {t.replace('_', ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Movement Restrictions</Text>
                    <View style={styles.chips}>
                        {RESTRICTIONS.map(r => (
                            <TouchableOpacity
                                key={r}
                                style={[styles.chip, current.restrictions?.includes(r) && styles.chipSelected]}
                                onPress={() => toggleRestriction(r)}
                            >
                                <Text style={[styles.chipText, current.restrictions?.includes(r) && styles.chipTextSelected]}>
                                    {r.replace(/_/g, ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity style={styles.button} onPress={addInjury}>
                        <Text style={styles.buttonText}>Add Injury</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.addButton} onPress={() => setAdding(true)}>
                    <Text style={styles.addButtonText}>+ Add Injury</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Next'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skip} onPress={() => router.push('/(onboarding)/context')}>
                <Text style={styles.skipText}>Skip — no injuries</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
    label: { fontSize: 15, fontWeight: '600', marginTop: 16, marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    chipSelected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    chipText: { fontSize: 14, color: '#333' },
    chipTextSelected: { color: '#16a34a', fontWeight: '600' },
    horizontalScroll: { marginBottom: 4 },
    injuryCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 14, marginBottom: 10, backgroundColor: '#f9fafb' },
    injuryCardTitle: { fontWeight: '600', fontSize: 15 },
    injuryCardSub: { color: '#666', fontSize: 13, marginTop: 2 },
    addForm: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 },
    addButton: { borderWidth: 1, borderColor: '#16a34a', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
    addButtonText: { color: '#16a34a', fontWeight: '600', fontSize: 15 },
    button: { backgroundColor: '#16a34a', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    skip: { alignItems: 'center', marginTop: 16, padding: 8 },
    skipText: { color: '#888', fontSize: 14 },
    error: { color: 'red', marginTop: 8, textAlign: 'center' },
    buttonDisabled: { backgroundColor: '#86efac' }
})