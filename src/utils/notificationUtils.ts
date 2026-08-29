import * as Notifications from 'expo-notifications';
import type { InventoryItem } from '../types';
import { getScheduledOccurrences } from './scheduleUtils';

export const BIOSTACK_NOTIFICATION_PREFIX = 'biostack-schedule';

export type NotificationPermissionState = string;

export interface NotificationDiagnostics {
  status: NotificationPermissionState;
  canAskAgain: boolean;
  scheduledCount: number;
}

export const getNotificationPermission = async () => {
  const settings = await Notifications.getPermissionsAsync();
  return {
    status: settings.status,
    canAskAgain: settings.canAskAgain,
  };
};

export const requestNotificationPermission = async () => {
  const current = await getNotificationPermission();
  if (current.status === 'granted') return current;
  if (current.status === 'denied' && !current.canAskAgain) return current;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      provideAppNotificationSettings: true,
    },
  });

  return {
    status: requested.status,
    canAskAgain: requested.canAskAgain,
  };
};

export const sendTestNotification = async (seconds = 60) => {
  const triggerDate = new Date(Date.now() + Math.max(5, seconds) * 1000);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'BioStack — Notification Test',
      body: 'Local notification berhasil dijadwalkan.',
      sound: 'default',
      data: { kind: 'diagnostic' },
    },
    trigger: { type: 'date', date: triggerDate },
  });
};

export const cancelNotificationIds = async (ids: string[]) => {
  await Promise.all(
    ids.filter(Boolean).map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
};

export const cancelAllScheduledNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

const makeNotificationDate = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = String(time || '08:00').split(':').map(Number);
  const result = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0, 0);
  return Number.isNaN(result.getTime()) ? null : result;
};

export const scheduleInventoryReminders = async (
  inventory: InventoryItem[],
  daysAhead = 30,
) => {
  const now = new Date();
  const occurrences = getScheduledOccurrences(inventory, now, Math.max(1, daysAhead), []);
  const idsByInventory = new Map<string, string[]>();

  for (const occurrence of occurrences) {
    const item = inventory.find((candidate) => candidate.id === occurrence.inventoryId);
    if (!item || item.isReminderActive === false) continue;
    const date = makeNotificationDate(occurrence.date, occurrence.time);
    if (!date || date <= now) continue;

    const existingIds = idsByInventory.get(item.id) || [];
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `BioStack — ${occurrence.peptideName}`,
        body: `Jadwal tracker ${occurrence.time}.`,
        sound: 'default',
        badge: 1,
        data: {
          kind: 'schedule',
          inventoryId: item.id,
          date: occurrence.date,
        },
      },
      trigger: { type: 'date', date },
    });

    existingIds.push(id);
    idsByInventory.set(item.id, existingIds);
  }

  return idsByInventory;
};

export const rebuildScheduleReminders = async (
  inventory: InventoryItem[],
  daysAhead = 30,
) => {
  await cancelAllScheduledNotifications();
  const permission = await getNotificationPermission();
  if (permission.status !== 'granted') return new Map<string, string[]>();

  return scheduleInventoryReminders(inventory, daysAhead);
};

export const getScheduledNotificationCount = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((request) => {
    const data = request.content.data as { kind?: string } | undefined;
    return data?.kind === 'schedule' || data?.kind === 'diagnostic';
  }).length;
};
