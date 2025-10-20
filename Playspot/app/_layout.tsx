import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Import the component (make sure the path is correct)

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Define theme-based colors
  const themeColors = {
    light: {
      background: '#ffffff',
      statusBar: 'auto' as const,
    },
    dark: {
      background: '#121212', // Dark background color
      statusBar: 'light' as const,
    }
  };

  const currentTheme = isDark ? themeColors.dark : themeColors.light;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <SafeAreaView style={{ 
          flex: 1, 
          backgroundColor: currentTheme.background 
        }}>
          <Stack
            screenOptions={{
              // Optional: Set global stack screen options based on theme
              contentStyle: {
                backgroundColor: currentTheme.background,
              },
              // You can also set header styles based on theme
              headerStyle: {
                backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
              },
              headerTintColor: isDark ? '#ffffff' : '#000000',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="forget" options={{ headerShown: false }} />
            <Stack.Screen name="Player/(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="Owner/(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="Owner/earnings" options={{ headerShown: false }} />
            <Stack.Screen name="Owner/bookings" options={{ headerShown: false }} />
            <Stack.Screen name="Owner/complaints" options={{ headerShown: false }} />
            <Stack.Screen name="Player/groundDetails" options={{ headerShown: false }} />
            <Stack.Screen name="document-upload" options={{ headerShown: false }} />
            <Stack.Screen name="Player/payment" options={{ headerShown: false }} />
            <Stack.Screen name="Player/booking" options={{ headerShown: false }} />
            <Stack.Screen name="Player/bookingConfirmation" options={{ headerShown: false }} />
            {/* Add the new screen */}
            <Stack.Screen 
              name="Owner/ground-availability-detail" 
              options={{ 
                title: "Manage Time Slots",
                headerShown: true,
                // Theme-specific header styling
                headerStyle: {
                  backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
                },
                headerTintColor: isDark ? '#ffffff' : '#000000',
                headerTitleStyle: {
                  color: isDark ? '#ffffff' : '#000000',
                },
              }} 
            />
          </Stack>
          <StatusBar style={currentTheme.statusBar} />
          <Toast />
        </SafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}