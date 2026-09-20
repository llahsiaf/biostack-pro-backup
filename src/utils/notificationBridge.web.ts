export type WebNotificationPermission = {
  status: 'granted' | 'denied' | 'default' | 'unavailable';
  canAskAgain: boolean;
};

export type NotificationTarget = {
  inventoryId?: string;
  date?: string;
};

export type NotificationResponseHandler = (
  target: NotificationTarget | null,
) => void;

/**
 * Web notification bridge.
 *
 * expo-notifications is native-only, so the web build uses this
 * no-op bridge instead of trying to call native notification APIs.
 *
 * Reminder scheduling on the web will be implemented separately
 * when a browser-compatible notification service is added.
 */

export const configureNotifications = (): void => {
  // Intentionally empty on web.
};

export const initializeNotifications = async (): Promise<void> => {
  // Native-only functionality.
};

export const getNotificationPermission =
  async (): Promise<WebNotificationPermission> => ({
    status: 'unavailable',
    canAskAgain: false,
  });

export const requestNotificationPermission =
  async (): Promise<WebNotificationPermission> => ({
    status: 'unavailable',
    canAskAgain: false,
  });

export const requestManualNotificationPermission =
  async (): Promise<WebNotificationPermission> => {
    return {
      status: 'unavailable',
      canAskAgain: false,
    };
  };

export const subscribeToNotificationResponse = (
  _handler: NotificationResponseHandler,
): { remove: () => void } => {
  return {
    remove: () => {
      // No-op on web.
    },
  };
};

export const getLastNotificationTarget =
  async (): Promise<NotificationTarget | null> => {
    return null;
  };

export const syncScheduleReminders = async (
  _inventory: unknown[],
  _injectionHistory: unknown[],
): Promise<void> => {
  // Web notification scheduling is intentionally disabled for now.
};

export const getScheduledNotificationCount = async (): Promise<number> => {
  return 0;
};
