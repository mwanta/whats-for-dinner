import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function Profile() {
    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
    button: {
        borderWidth: 1, borderColor: '#dc2626',
        borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12
    },
    buttonText: { color: '#dc2626', fontWeight: '600' }
})