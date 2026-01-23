import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { getRecentEntries, Entry } from '../../lib/entries';
import SkillMap from '../../components/SkillMap';
import { SKILLS } from '../../lib/midl-skills';

export default function TrackerScreen() {
  const { user } = useAuth();
  const [currentSkill, setCurrentSkill] = useState('00');
  const [stats, setStats] = useState({ streak: 0, current_skill_days: 0 });
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    // Load user profile
    const { data: profile } = await supabase
      .from('users')
      .select('current_skill, stats')
      .eq('id', user!.id)
      .single();

    if (profile) {
      setCurrentSkill(profile.current_skill || '00');
      setStats(profile.stats || { streak: 0, current_skill_days: 0 });
    }

    // Load recent entries
    const recentEntries = await getRecentEntries(user!.id, 10);
    setEntries(recentEntries);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6 pt-4">
          {/* Skill Map Section */}
          <View className="mb-6">
            <Text className="text-lg font-medium text-gray-800 mb-3">
              Your Journey
            </Text>
            <SkillMap currentSkill={currentSkill} />
          </View>

          {/* Stats Section */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white/80 rounded-2xl p-4">
              <Text className="text-gray-500 text-sm">Streak</Text>
              <Text className="text-2xl font-bold text-gray-800">
                {stats.streak} days
              </Text>
            </View>
            <View className="flex-1 bg-white/80 rounded-2xl p-4">
              <Text className="text-gray-500 text-sm">Current Skill</Text>
              <Text className="text-lg font-bold text-gray-800" numberOfLines={2}>
                {SKILLS[currentSkill]?.name || 'Getting Started'}
              </Text>
              <Text className="text-gray-500 text-sm">
                Day {stats.current_skill_days || 1}
              </Text>
            </View>
          </View>

          {/* Session History */}
          <View className="mb-32">
            <Text className="text-lg font-medium text-gray-800 mb-3">
              Recent Sessions
            </Text>
            {entries.length === 0 ? (
              <View className="bg-white/80 rounded-2xl p-6 items-center">
                <Text className="text-gray-500">No sessions yet</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Tap Reflect or Ask to start
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {entries.map((entry) => (
                  <View
                    key={entry.id}
                    className="bg-white/80 rounded-2xl p-4"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-gray-500 text-sm">
                            {formatDate(entry.created_at)}
                          </Text>
                          <View
                            className={`px-2 py-0.5 rounded ${
                              entry.type === 'reflect'
                                ? 'bg-sage-light'
                                : 'bg-lavender'
                            }`}
                          >
                            <Text className="text-xs text-gray-600 capitalize">
                              {entry.type}
                            </Text>
                          </View>
                        </View>
                        <Text
                          className="text-gray-800 mt-2"
                          numberOfLines={2}
                        >
                          {entry.summary || entry.raw_content.slice(0, 100)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
