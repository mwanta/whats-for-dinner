import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
    }

    const handleRegister = async () => {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setError(error.message)
        else router.replace('/(onboarding)/goals')
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>What's For Dinner?</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={handleRegister}>
                <Text style={styles.buttonSecondaryText}>Create Account</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    button: { backgroundColor: '#16a34a', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 8 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    buttonSecondary: { borderWidth: 1, borderColor: '#16a34a', borderRadius: 8, padding: 14, alignItems: 'center' },
    buttonSecondaryText: { color: '#16a34a', fontWeight: '600', fontSize: 16 },
    error: { color: 'red', marginBottom: 12, textAlign: 'center' }
})