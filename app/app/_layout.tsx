import '../lib/nativewind-interop';
import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { DraftProvider } from '../lib/draft-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { rescheduleAllReminders } from '../lib/notifications';

function NotificationInit() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) rescheduleAllReminders(user.id);
  }, [user]);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <DraftProvider>
            <NotificationInit />
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(main)" />
            </Stack>
          </DraftProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
