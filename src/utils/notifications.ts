import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Medicine } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medialert', {
      name: 'MediAlert Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  return true;
}

export async function cancelNotifications(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function scheduleNotifications(medicine: Medicine): Promise<string[]> {
  const ids: string[] = [];
  const body = `${medicine.dosage}${medicine.instructions ? ' — ' + medicine.instructions : ''}`;

  if (medicine.reminderType === 'one-time' && medicine.scheduledDate) {
    const date = new Date(medicine.scheduledDate);
    if (date > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 Time for ${medicine.name}`,
          body,
          sound: 'default',
          data: { medicineId: medicine.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
      ids.push(id);
    }
    return ids;
  }

  // Recurring
  for (const time of medicine.times) {
    const [hour, minute] = time.split(':').map(Number);

    if (medicine.frequency === 'daily') {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 Time for ${medicine.name}`,
          body,
          sound: 'default',
          data: { medicineId: medicine.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      ids.push(id);
    } else if (
      (medicine.frequency === 'weekly' || medicine.frequency === 'custom') &&
      medicine.daysOfWeek?.length
    ) {
      for (const weekday of medicine.daysOfWeek) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `💊 Time for ${medicine.name}`,
            body,
            sound: 'default',
            data: { medicineId: medicine.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: weekday + 1, // expo uses 1=Sun … 7=Sat
            hour,
            minute,
          },
        });
        ids.push(id);
      }
    }
  }

  return ids;
}

export function formatNextReminder(medicine: Medicine): string {
  if (!medicine.active) return 'Paused';

  if (medicine.reminderType === 'one-time' && medicine.scheduledDate) {
    const d = new Date(medicine.scheduledDate);
    if (d < new Date()) return 'Completed';
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }

  if (medicine.times.length === 0) return 'No times set';

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timesStr = medicine.times.join(', ');

  if (medicine.frequency === 'daily') return `Daily at ${timesStr}`;

  const days = (medicine.daysOfWeek ?? []).map((d) => DAY_NAMES[d]).join(', ');
  return `${days} at ${timesStr}`;
}
