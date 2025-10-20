import AnimatedTabBar from '@/components/AnimatedTabBar';
import { Ionicons } from '@expo/vector-icons'; // ✅ this brings in Ionicons // adjust path
import { Tabs } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="grounds" options={{ title: 'Grounds', tabBarIcon: ({ color }) => <Ionicons name="football-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="availability" options={{ title: 'Availability', tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="payment" options={{ title: 'Pay Method', tabBarIcon: ({ color }) => <Ionicons name="wallet-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> }} />
    </Tabs>
  );
}
