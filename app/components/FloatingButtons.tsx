import { View, Pressable, Text } from 'react-native';
import { router, usePathname } from 'expo-router';

export default function FloatingButtons() {
  const pathname = usePathname();

  // Hide on modal screens
  if (pathname !== '/tracker' && pathname !== '/(main)/tracker') {
    return null;
  }

  return (
    <View className="absolute bottom-8 left-0 right-0 flex-row justify-center gap-4 px-6">
      <Pressable
        onPress={() => router.push('/(main)/reflect')}
        className="flex-1 bg-white rounded-2xl py-4 shadow-lg border border-gray-100"
      >
        <Text className="text-center text-gray-800 font-medium">Reflect</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/(main)/ask')}
        className="flex-1 bg-muted-blue rounded-2xl py-4 shadow-lg"
      >
        <Text className="text-center text-white font-medium">Ask</Text>
      </Pressable>
    </View>
  );
}
