import AnimatedTabBar from '@/components/AnimatedTabBar';
import { Tabs } from 'expo-router';

export default function PlayerLayout() {
  return (
      <Tabs
        tabBar={(props) => <AnimatedTabBar  {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="grounds"
          options={{
            title: 'Grounds',
          }}
        />
        <Tabs.Screen
          name="bookingHistory"
          options={{
            title: 'Booking',
          }}
        />
        <Tabs.Screen
          name="complaints"
          options={{
            title: 'Complaints',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
  );
}
