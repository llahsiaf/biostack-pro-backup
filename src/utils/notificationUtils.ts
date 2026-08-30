import * as Notifications from 'expo-notifications';
import type { InjectionLog, InventoryItem } from '../types';
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
  return { status: settings.status, canAskAgain: settings.canAskAgain };
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

  return { status: requested.status, canAskAgain: requested.canAskAgain };
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
    ids.filter(Boolean).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id),
    ),
  );
};

export const cancelAllScheduledNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

const makeNotificationDate = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = String(time || '08:00').split(':').map(Number);

  const result = new Date(
    year,
    (month || 1) - 1,
    day || 1,
    hour || 0,
    minute || 0,
    0,
    0,
  );

  return Number.isNaN(result.getTime()) ? null : result;
};

const makeReminderDate = (scheduledDate: Date, minutesBefore = 5) =>
  new Date(scheduledDate.getTime() - minutesBefore * 60 * 1000);

export const scheduleInventoryReminders = async (
  inventory: InventoryItem[],
  daysAhead = 30,
  logs: InjectionLog[] = [],
) => {
  const now = new Date();
  const occurrences = getScheduledOccurrences(
    inventory,
    now,
    Math.max(1, daysAhead),
    logs,
  );

  const idsByInventory = new Map<string, string[]>();

  for (const occurrence of occurrences) {
    // A completed occurrence must never receive a reminder.
    if (occurrence.status === 'completed') continue;

    const item = inventory.find(
      (candidate) => candidate.id === occurrence.inventoryId,
    );

    if (!item || item.isReminderActive === false) continue;
    if (!item.injectionTime) continue;

    const scheduledDate = makeNotificationDate(
      occurrence.date,
      occurrence.time,
    );

    if (!scheduledDate) continue;

    const reminderDate = makeReminderDate(scheduledDate, 5);

    // Never schedule a notification whose reminder time has passed.
    if (reminderDate <= now) continue;

    const existingIds = idsByInventory.get(item.id) || [];

    const notificationId =
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${occurrence.peptideName} · ${occurrence.time}`,
          body: 'Jadwal berikutnya dalam 5 menit • Buka BioStack',
          sound: 'default',
          badge: 1,
          data: {
            kind: 'schedule',
            inventoryId: item.id,
            date: occurrence.date,
            time: occurrence.time,
            deepLink: 'today',
          },
        },
        trigger: {
          type: 'date',
          date: reminderDate,
        },
      });

    existingIds.push(notificationId);
    idsByInventory.set(item.id, existingIds);
  }

  return idsByInventory;
};

export const rebuildScheduleReminders = async (
  inventory: InventoryItem[],
  daysAhead = 30,
  logs: InjectionLog[] = [],
) => {
  await cancelAllScheduledNotifications();

  const permission = await getNotificationPermission();

  if (permission.status !== 'granted') {
    return new Map<string, string[]>();
  }

  return scheduleInventoryReminders(
    inventory,
    daysAhead,
    logs,
  );
};

export const getScheduledNotificationCount = async () => {
  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync();

  return scheduled.filter((request) => {
    const data = request.content.data as
      | { kind?: string }
      | undefined;

    return (
      data?.kind === 'schedule' ||
      data?.kind === 'diagnostic'
    );
  }).length;
};
