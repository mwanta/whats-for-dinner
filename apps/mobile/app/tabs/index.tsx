import { View, Text, StyleSheet } from 'react-native'

export default function MealPlan() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Meal Plan</Text>
            <Text style={styles.subtitle}>Coming soon</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: '#888', marginTop: 8 }
})