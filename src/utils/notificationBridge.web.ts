export type WebNotificationPermission = {
  status: 'granted' | 'denied' | 'default' | 'unavailable';
  canAskAgain: boolean;
};

export type NotificationTarget = {
  inventoryId?: string;
  date?: string;
  time?: string;
};

export type NotificationResponseHandler = (
  target: NotificationTarget | null,
) => void;

/**
 * Browser-side notification bridge.
 *
 * expo-notifications is native-only, so the web build never imports
 * or executes its APIs. Reminder scheduling on the web is disabled
 * for now rather than pretending to provide native scheduling parity.
 */

export const configureNotifications = (): void => {
  // No-op on web.
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

export const subscribeToNotificationResponse = (
  _handler: NotificationResponseHandler,
): { remove: () => void } => ({
  remove: () => {
    // No-op on web.
  },
});

export const getLastNotificationTarget =
  async (): Promise<NotificationTarget | null> => null;

export const syncScheduleReminders = async (
  _inventory: unknown[],
  _injectionHistory: unknown[],
): Promise<Map<string, string[]>> => {
  // Web reminder scheduling is intentionally disabled for now.
  return new Map<string, string[]>();
};
