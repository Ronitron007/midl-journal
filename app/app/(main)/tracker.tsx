import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrackerScreen() {
  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6 pt-4">
          {/* Skill Map Section */}
          <View className="mb-6">
            <Text className="text-lg font-medium text-gray-800 mb-3">
              Your Journey
            </Text>
            <View className="bg-white/80 rounded-2xl p-4 h-32 justify-center items-center">
              <Text className="text-gray-500">Skill Map (coming soon)</Text>
            </View>
          </View>

          {/* Stats Section */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white/80 rounded-2xl p-4">
              <Text className="text-gray-500 text-sm">Streak</Text>
              <Text className="text-2xl font-bold text-gray-800">0 days</Text>
            </View>
            <View className="flex-1 bg-white/80 rounded-2xl p-4">
              <Text className="text-gray-500 text-sm">Current Skill</Text>
              <Text className="text-2xl font-bold text-gray-800">00</Text>
              <Text className="text-gray-500 text-sm">Day 1</Text>
            </View>
          </View>

          {/* Session History */}
          <View className="mb-32">
            <Text className="text-lg font-medium text-gray-800 mb-3">
              Recent Sessions
            </Text>
            <View className="bg-white/80 rounded-2xl p-6 items-center">
              <Text className="text-gray-500">No sessions yet</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Tap Reflect or Ask to start
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
