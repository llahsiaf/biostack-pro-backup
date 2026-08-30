import * as Notifications from 'expo-notifications';
import type { InventoryItem } from '../types';
import {
  getScheduledOccurrences,
} from './scheduleUtils';

export const BIOSTACK_NOTIFICATION_PREFIX =
  'biostack-schedule';

export type NotificationPermissionState =
  string;

export interface NotificationDiagnostics {
  status: NotificationPermissionState;
  canAskAgain: boolean;
  scheduledCount: number;
}

export const getNotificationPermission =
  async () => {
    const settings =
      await Notifications.getPermissionsAsync();

    return {
      status: settings.status,
      canAskAgain:
        settings.canAskAgain,
    };
  };

export const requestNotificationPermission =
  async () => {
    const current =
      await getNotificationPermission();

    if (
      current.status ===
      'granted'
    ) {
      return current;
    }

    if (
      current.status ===
        'denied' &&
      !current.canAskAgain
    ) {
      return current;
    }

    const requested =
      await Notifications.requestPermissionsAsync(
        {
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            provideAppNotificationSettings:
              true,
          },
        },
      );

    return {
      status:
        requested.status,
      canAskAgain:
        requested.canAskAgain,
    };
  };

/**
 * Notification test yang sudah terbukti
 * berhasil pada iPhone.
 *
 * Jangan diubah menjadi notification
 * schedule biasa.
 */
export const sendTestNotification =
  async (
    seconds = 60,
  ) => {
    const triggerDate =
      new Date(
        Date.now() +
          Math.max(
            5,
            seconds,
          ) *
            1000,
      );

    return Notifications.scheduleNotificationAsync(
      {
        content: {
          title:
            'BioStack — Notification Test',

          body:
            'Local notification berhasil dijadwalkan.',

          sound: 'default',

          data: {
            kind: 'diagnostic',
          },
        },

        trigger: {
          type: 'date',
          date: triggerDate,
        },
      },
    );
  };

export const cancelNotificationIds =
  async (
    ids: string[],
  ) => {
    await Promise.all(
      ids
        .filter(Boolean)
        .map((id) =>
          Notifications.cancelScheduledNotificationAsync(
            id,
          ),
        ),
    );
  };

export const cancelAllScheduledNotifications =
  async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

/**
 * Membuat Date lokal dari:
 *
 * YYYY-MM-DD
 * HH:mm
 */
const makeNotificationDate = (
  date: string,
  time: string,
) => {
  const [
    year,
    month,
    day,
  ] = date
    .split('-')
    .map(Number);

  const [
    hour,
    minute,
  ] = String(
    time || '08:00',
  )
    .split(':')
    .map(Number);

  const result =
    new Date(
      year,
      (month || 1) - 1,
      day || 1,
      hour || 0,
      minute || 0,
      0,
      0,
    );

  return Number.isNaN(
    result.getTime(),
  )
    ? null
    : result;
};

/**
 * Reminder default BioStack:
 *
 * 5 menit sebelum jadwal.
 *
 * Contoh:
 *
 * Jadwal     11:00
 * Reminder   10:55
 */
const makeReminderDate = (
  scheduledDate: Date,
  minutesBefore = 5,
) => {
  return new Date(
    scheduledDate.getTime() -
      minutesBefore *
        60 *
        1000,
  );
};

/**
 * Membuat seluruh reminder dari
 * inventory yang tersedia.
 *
 * Notification:
 *
 * 5 menit sebelum jadwal
 *
 * Hanya satu reminder per occurrence.
 */
export const scheduleInventoryReminders =
  async (
    inventory: InventoryItem[],
    daysAhead = 30,
  ) => {
    const now =
      new Date();

    const occurrences =
      getScheduledOccurrences(
        inventory,
        now,
        Math.max(
          1,
          daysAhead,
        ),
        [],
      );

    const idsByInventory =
      new Map<
        string,
        string[]
      >();

    for (
      const occurrence of occurrences
    ) {
      const item =
        inventory.find(
          (candidate) =>
            candidate.id ===
            occurrence.inventoryId,
        );

      if (!item) {
        continue;
      }

      /**
       * Reminder dapat dimatikan dari
       * konfigurasi peptide.
       */
      if (
        item.isReminderActive ===
        false
      ) {
        continue;
      }

      /**
       * Jadwal dan konfigurasi dasar
       * sudah difilter oleh scheduleUtils.
       */
      if (
        !item.injectionTime
      ) {
        continue;
      }

      const scheduledDate =
        makeNotificationDate(
          occurrence.date,
          occurrence.time,
        );

      if (!scheduledDate) {
        continue;
      }

      const reminderDate =
        makeReminderDate(
          scheduledDate,
          5,
        );

      /**
       * Jangan membuat reminder yang
       * waktunya sudah lewat.
       */
      if (
        reminderDate <= now
      ) {
        continue;
      }

      const existingIds =
        idsByInventory.get(
          item.id,
        ) || [];

      const notificationId =
        await Notifications.scheduleNotificationAsync(
          {
            content: {
              /**
               * Format yang kita sepakati:
               *
               * MOTS-c · 11:00
               */
              title:
                `${occurrence.peptideName} · ${occurrence.time}`,

              /**
               * Tidak menggunakan body
               * "Jadwal tracker..."
               * lagi.
               */
              body:
                'Jadwal berikutnya dalam 5 menit • Buka BioStack',

              sound:
                'default',

              badge: 1,

              data: {
                kind:
                  'schedule',

                inventoryId:
                  item.id,

                date:
                  occurrence.date,

                time:
                  occurrence.time,

                /**
                 * Dipakai oleh App nanti
                 * untuk membuka Today.
                 */
                deepLink:
                  'today',
              },
            },

            trigger: {
              type: 'date',
              date: reminderDate,
            },
          },
        );

      existingIds.push(
        notificationId,
      );

      idsByInventory.set(
        item.id,
        existingIds,
      );
    }

    return idsByInventory;
  };

/**
 * Rebuild notification schedule.
 *
 * Flow:
 *
 * cancel lama
 *      ↓
 * cek permission
 *      ↓
 * generate baru
 *      ↓
 * 5 menit sebelum jadwal
 */
export const rebuildScheduleReminders =
  async (
    inventory: InventoryItem[],
    daysAhead = 30,
  ) => {
    await cancelAllScheduledNotifications();

    const permission =
      await getNotificationPermission();

    if (
      permission.status !==
      'granted'
    ) {
      return new Map<
        string,
        string[]
      >();
    }

    return scheduleInventoryReminders(
      inventory,
      daysAhead,
    );
  };

/**
 * Diagnostic count.
 */
export const getScheduledNotificationCount =
  async () => {
    const scheduled =
      await Notifications.getAllScheduledNotificationsAsync();

    return scheduled.filter(
      (request) => {
        const data =
          request.content
            .data as
            | {
                kind?: string;
              }
            | undefined;

        return (
          data?.kind ===
            'schedule' ||
          data?.kind ===
            'diagnostic'
        );
      },
    ).length;
  };
