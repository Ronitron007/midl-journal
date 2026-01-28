import { View, Text, Switch, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import {
  getReminderSettings,
  saveReminderSettings,
  isJournalTimeWarning,
  ReminderSettings,
  TimeOfDay,
} from '../../lib/reminder-settings';
import { rescheduleAllReminders } from '../../lib/notifications';

function timeToDate(t: TimeOfDay): Date {
  const d = new Date();
  d.setHours(t.hour, t.minute, 0, 0);
  return d;
}

function formatTime(t: TimeOfDay): string {
  const d = timeToDate(t);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [showMedPicker, setShowMedPicker] = useState(Platform.OS === 'ios');
  const [showJournalPicker, setShowJournalPicker] = useState(
    Platform.OS === 'ios'
  );

  useEffect(() => {
    getReminderSettings().then(setSettings);
  }, []);

  if (!settings) return null;

  const save = async (patch: Partial<ReminderSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await saveReminderSettings(patch);
    if (user) await rescheduleAllReminders(user.id);
  };

  const onMedTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowMedPicker(false);
    if (!date) return;
    save({ meditationTime: { hour: date.getHours(), minute: date.getMinutes() } });
  };

  const onJournalTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowJournalPicker(false);
    if (!date) return;
    save({ journalTime: { hour: date.getHours(), minute: date.getMinutes() } });
  };

  const showWarning = isJournalTimeWarning(
    settings.meditationTime,
    settings.journalTime
  );

  return (
    <LinearGradient colors={['#e6e0f5', '#fde8d7']} className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6 pt-4">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <Pressable onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="chevron-back" size={24} color="#374151" />
            </Pressable>
            <Text className="text-xl font-semibold text-gray-800">
              Settings
            </Text>
          </View>

          {/* Meditation Reminder */}
          <View className="bg-white/80 rounded-2xl p-5 mb-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-base font-medium text-gray-800">
                Meditation Reminder
              </Text>
              <Text className="text-sm text-gray-400">Always on</Text>
            </View>
            <Text className="text-sm text-gray-500 mb-3">
              Daily reminder to sit
            </Text>

            {Platform.OS === 'android' && (
              <Pressable
                onPress={() => setShowMedPicker(true)}
                className="bg-gray-100 rounded-xl px-4 py-3"
              >
                <Text className="text-gray-700">
                  {formatTime(settings.meditationTime)}
                </Text>
              </Pressable>
            )}
            {showMedPicker && (
              <DateTimePicker
                value={timeToDate(settings.meditationTime)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onMedTimeChange}
              />
            )}
          </View>

          {/* Journal Reminder */}
          <View className="bg-white/80 rounded-2xl p-5 mb-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-base font-medium text-gray-800">
                Journal Reminder
              </Text>
              <Switch
                value={settings.journalEnabled}
                onValueChange={(v) => save({ journalEnabled: v })}
                trackColor={{ true: '#7c9a8e' }}
              />
            </View>
            <Text className="text-sm text-gray-500 mb-3">
              Only notifies if you haven't journaled today
            </Text>

            {settings.journalEnabled && (
              <>
                {Platform.OS === 'android' && (
                  <Pressable
                    onPress={() => setShowJournalPicker(true)}
                    className="bg-gray-100 rounded-xl px-4 py-3"
                  >
                    <Text className="text-gray-700">
                      {formatTime(settings.journalTime)}
                    </Text>
                  </Pressable>
                )}
                {showJournalPicker && (
                  <DateTimePicker
                    value={timeToDate(settings.journalTime)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onJournalTimeChange}
                  />
                )}

                {showWarning && (
                  <View className="bg-amber-50 rounded-xl px-4 py-3 mt-3 flex-row items-start gap-2">
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#b45309"
                    />
                    <Text className="text-amber-700 text-sm flex-1">
                      It's always a good idea to reflect right after meditation
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Sign Out */}
          <Pressable
            onPress={signOut}
            className="bg-white/60 rounded-2xl p-4 items-center mt-8 mb-32"
          >
            <Text className="text-red-500 font-medium">Sign Out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
