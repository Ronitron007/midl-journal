import { View, Text, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { getRecentEntries, deleteEntry, Entry } from '../../lib/entries';
import SkillMap from '../../components/SkillMap';
import { SKILLS } from '../../lib/midl-skills';
import EntryCard from '../../components/EntryCard';
import PreSitGuidance, { PreSitGuidanceData } from '../../components/PreSitGuidance';
import { getProgressionStats, advanceToNextSkill, ProgressionStats } from '../../lib/progression';
import { ai } from '../../lib/ai';

export default function TrackerScreen() {
  const { user } = useAuth();
  const [currentSkill, setCurrentSkill] = useState('00');
  const [stats, setStats] = useState({ streak: 0, current_skill_days: 0 });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [progressionStats, setProgressionStats] = useState<ProgressionStats | null>(null);
  const [preSitGuidance, setPreSitGuidance] = useState<PreSitGuidanceData | null>(null);

  // Refresh on screen focus (e.g., returning from reflect screen)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserData();
      }
    }, [user])
  );

  const loadUserData = async (showRefreshing = false) => {
                                                                                                                                                  
    // ai.generateContextSummary('backfill'); 
    if (showRefreshing) setRefreshing(true);
    // Load user profile
    const { data: profile } = await supabase
      .from('users')
      .select('current_skill, stats, pre_sit_guidance')
      .eq('id', user!.id)
      .single();

    const skill = profile?.current_skill || '00';
    if (profile) {
      setCurrentSkill(skill);
      setStats(profile.stats || { streak: 0, current_skill_days: 0 });
      setPreSitGuidance(profile.pre_sit_guidance as PreSitGuidanceData | null);
    }

    // Load progression stats for current skill
    const progStats = await getProgressionStats(user!.id, skill);
    setProgressionStats(progStats);

    // Load recent entries
    const recentEntries = await getRecentEntries(user!.id, 10);
    setEntries(recentEntries);
    if (showRefreshing) setRefreshing(false);
  };

  const onRefresh = () => loadUserData(true);

  const handleDelete = async (entryId: string) => {
    const success = await deleteEntry(entryId);
    if (success) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    }
  };

  const handleAdvance = async () => {
    if (!progressionStats?.readyToAdvance || !progressionStats?.nextSkillId) return;

    const nextSkillName = SKILLS[progressionStats.nextSkillId]?.name || progressionStats.nextSkillId;

    Alert.alert(
      'Advance to Next Skill?',
      `You've demonstrated readiness for Skill ${progressionStats.nextSkillId}: ${nextSkillName}. This will update your practice focus.`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Advance',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const result = await advanceToNextSkill(user!.id, currentSkill);
            if (result.success) {
              loadUserData();
            } else {
              Alert.alert('Error', result.error || 'Could not advance skill');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1 px-6 pt-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-lg font-medium text-forest">
              Your Journey
            </Text>
            <Pressable onPress={() => router.push('/settings')} className="p-1">
              <Ionicons name="settings-outline" size={22} color="#707927" />
            </Pressable>
          </View>

          {/* Pre-Sit Guidance */}
          <PreSitGuidance guidance={preSitGuidance} />

          {/* Skill Map Section */}
          <View className="mb-6">
            <SkillMap
              currentSkill={currentSkill}
              progressionStats={progressionStats}
              onAdvance={handleAdvance}
            />
          </View>

          {/* Stats Section */}
          

          {/* Session History */}
          <View className="mb-32">
            <Text className="text-lg font-medium text-forest mb-3">
              Recent Sessions
            </Text>
            {entries.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center">
                <Text className="text-olive">No sessions yet</Text>
                <Text className="text-olive/70 text-sm mt-1">
                  Tap Reflect or Ask to start
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
