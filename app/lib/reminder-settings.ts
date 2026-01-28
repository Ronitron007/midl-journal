import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'reminder_settings';

export type TimeOfDay = { hour: number; minute: number };

export type ReminderSettings = {
  meditationTime: TimeOfDay;
  journalEnabled: boolean;
  journalTime: TimeOfDay;
  journalSuppressedSince: string | null; // ISO date or null
};

const DEFAULTS: ReminderSettings = {
  meditationTime: { hour: 8, minute: 0 },
  journalEnabled: true,
  journalTime: { hour: 9, minute: 0 },
  journalSuppressedSince: null,
};

export async function getReminderSettings(): Promise<ReminderSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULTS;
  return { ...DEFAULTS, ...JSON.parse(raw) };
}

export async function saveReminderSettings(
  settings: Partial<ReminderSettings>
): Promise<ReminderSettings> {
  const current = await getReminderSettings();
  const merged = { ...current, ...settings };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

/** Returns true if journal time is >2hrs after meditation time */
export function isJournalTimeWarning(
  medTime: TimeOfDay,
  journalTime: TimeOfDay
): boolean {
  const medMinutes = medTime.hour * 60 + medTime.minute;
  const journalMinutes = journalTime.hour * 60 + journalTime.minute;
  const gap = journalMinutes - medMinutes;
  // Handle wrap-around (journal before meditation) — no warning
  if (gap < 0) return false;
  return gap > 120;
}
