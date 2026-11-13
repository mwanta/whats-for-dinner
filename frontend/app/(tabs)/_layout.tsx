import { Tabs } from 'expo-router'

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#16a34a',
                tabBarInactiveTintColor: '#888',
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Meal Plan' }} />
            <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
            <Tabs.Screen name="recommendations" options={{ title: 'Discover' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
    )
}