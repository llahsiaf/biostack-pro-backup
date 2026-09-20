import * as Notifications from 'expo-notifications';
import {
  getNotificationPermission as getPermission,
  requestNotificationPermission as requestPermission,
  rebuildScheduleReminders,
} from './notificationUtils';
import type { InjectionLog, InventoryItem } from '../types';

export type NotificationTarget = {
  inventoryId?: string;
  date?: string;
  time?: string;
};

export type NotificationResponseHandler = (
  target: NotificationTarget | null,
) => void;

export const configureNotifications = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

export const getNotificationPermission = getPermission;

export const requestNotificationPermission = requestPermission;

export const syncScheduleReminders = async (
  inventory: InventoryItem[],
  injectionHistory: InjectionLog[],
): Promise<Map<string, string[]>> => {
  const permission = await getPermission();

  if (permission.status !== 'granted') {
    return new Map<string, string[]>();
  }

  return rebuildScheduleReminders(
    inventory,
    30,
    injectionHistory,
  );
};

export const subscribeToNotificationResponse = (
  handler: NotificationResponseHandler,
): { remove: () => void } => {
  const subscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | {
            kind?: string;
            inventoryId?: string;
            date?: string;
            time?: string;
          }
        | undefined;

      if (data?.kind === 'schedule') {
        handler({
          inventoryId: data.inventoryId,
          date: data.date,
          time: data.time,
        });
      } else {
        handler(null);
      }
    });

  return {
    remove: () => subscription.remove(),
  };
};

export const getLastNotificationTarget =
  async (): Promise<NotificationTarget | null> => {
    const response =
      await Notifications.getLastNotificationResponseAsync();

    if (!response) {
      return null;
    }

    const data = response.notification.request.content.data as
      | {
          kind?: string;
          inventoryId?: string;
          date?: string;
          time?: string;
        }
      | undefined;

    if (data?.kind !== 'schedule') {
      return null;
    }

    return {
      inventoryId: data.inventoryId,
      date: data.date,
      time: data.time,
    };
  };
