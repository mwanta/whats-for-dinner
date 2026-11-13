import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import {router} from "expo-router";

export default function Profile() {
    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity style={styles.updateButton} onPress={() => router.push('/(new_user)/goals')}>
                <Text style={styles.updateText}>Update Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
    logoutButton: {
        borderWidth: 1, borderColor: '#dc2626',
        borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12,
    },
    updateButton: {
        borderWidth: 1, borderColor: '#4b86ff',
        borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12,
    },
    logoutText: { color: '#dc2626', fontWeight: '600' },
    updateText: { color: '#4b86ff', fontWeight: '600' }
})