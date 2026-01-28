import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  getReminderSettings,
  saveReminderSettings,
  TimeOfDay,
} from './reminder-settings';
import { getEntriesForDate, getEntriesForDateRange } from './entries';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleDailyNotification(
  id: string,
  title: string,
  body: string,
  time: TimeOfDay
) {
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
    },
  });
}

/**
 * Checks streak suppression state and returns whether journal
 * notifications should be suppressed.
 *
 * State machine:
 *   ACTIVE → SUPPRESSED: last 3 days all have entries
 *   SUPPRESSED → ACTIVE: last 2 days both have NO entries
 */
async function shouldSuppressJournal(userId: string): Promise<boolean> {
  const settings = await getReminderSettings();
  const now = new Date();

  if (settings.journalSuppressedSince) {
    // Currently SUPPRESSED — check if last 2 days have NO entries
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const entries = await getEntriesForDateRange(userId, twoDaysAgo, now);

    // Check each of the last 2 days
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const hasYesterday = entries.some((e) => {
      const d = new Date(e.created_at);
      return d.toDateString() === yesterday.toDateString();
    });
    const hasToday = entries.some((e) => {
      const d = new Date(e.created_at);
      return d.toDateString() === now.toDateString();
    });

    if (!hasYesterday && !hasToday) {
      // SUPPRESSED → ACTIVE
      await saveReminderSettings({ journalSuppressedSince: null });
      return false;
    }
    return true;
  }

  // Currently ACTIVE — check if last 3 days all have entries
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0);

  const entries = await getEntriesForDateRange(userId, threeDaysAgo, now);

  let allThreeHaveEntries = true;
  for (let i = 1; i <= 3; i++) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const hasEntry = entries.some((e) => {
      const d = new Date(e.created_at);
      return d.toDateString() === day.toDateString();
    });
    if (!hasEntry) {
      allThreeHaveEntries = false;
      break;
    }
  }

  if (allThreeHaveEntries) {
    // ACTIVE → SUPPRESSED
    await saveReminderSettings({
      journalSuppressedSince: now.toISOString(),
    });
    return true;
  }

  return false;
}

/**
 * Cancel all and reschedule based on current settings.
 * Call on every app open.
 */
export async function rescheduleAllReminders(userId: string) {
  const granted = await requestPermissions();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = await getReminderSettings();

  // Meditation reminder — always on
  await scheduleDailyNotification(
    'meditation',
    'Time to meditate',
    'Your daily practice is waiting.',
    settings.meditationTime
  );

  // Journal reminder — conditional
  if (!settings.journalEnabled) return;

  const suppressed = await shouldSuppressJournal(userId);
  if (suppressed) return;

  // Check if already journaled today
  const todayEntries = await getEntriesForDate(userId, new Date());
  if (todayEntries.length > 0) return;

  await scheduleDailyNotification(
    'journal',
    'Reflect on your practice',
    "Take a moment to journal about today's meditation.",
    settings.journalTime
  );
}
