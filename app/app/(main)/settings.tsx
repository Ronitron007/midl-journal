import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6 pt-4">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <Pressable onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="chevron-back" size={24} color="#3a5222" />
            </Pressable>
            <Text className="text-xl font-semibold text-forest">
              Settings
            </Text>
          </View>

          {/* Sign Out */}
          <Pressable
            onPress={async () => {
              await signOut();
              router.replace('/onboarding');
            }}
            className="bg-white rounded-2xl p-4 items-center mt-8 mb-32"
          >
            <Text className="text-red-500 font-medium">Sign Out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
