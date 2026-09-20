import * as Notifications from 'expo-notifications';
import {
  getNotificationPermission as getPermission,
  requestNotificationPermission as requestPermission,
} from './notificationUtils';

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
