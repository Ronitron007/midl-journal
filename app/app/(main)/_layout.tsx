import { Stack } from 'expo-router';
import FloatingButtons from '../../components/FloatingButtons';
import { View } from 'react-native';

export default function MainLayout() {
  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="tracker" />
        <Stack.Screen name="settings" />
        <Stack.Screen
          name="reflect"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="ask"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="entry/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="guidance" options={{ presentation: 'card' }} />
      </Stack>
      <FloatingButtons />
    </View>
  );
}
