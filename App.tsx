import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';

import {
  Activity,
  FlaskConical,
  RotateCw,
  History,
  Snowflake,
  TrendingUp,
  Bell,
  Settings,
  ShieldCheck,
} from 'lucide-react-native';

import { InventoryScreen } from './src/screens/InventoryScreen';
import { RotationScreen } from './src/screens/RotationScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { FreezerScreen } from './src/screens/FreezerScreen';
import { FloatingAIChat } from './src/components/FloatingAIChat';
import { TodayScreen } from './src/screens/TodayScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';

import { COLORS, RADIUS } from './src/theme';
import { useBioStackStore } from './src/store/useBioStackStore';

import {
  configureNotifications,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToNotificationResponse,
  getLastNotificationTarget,
  syncScheduleReminders,
} from './src/utils/notificationBridge';

import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';

function BioStackApp() {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    | 'today'
    | 'inventory'
    | 'rotation'
    | 'history'
    | 'freezer'
    | 'analytics'
    | 'settings'
  >('today');

  const [notificationTarget, setNotificationTarget] = useState<{
    inventoryId?: string;
    date?: string;
  } | null>(null);

  const injectionHistory = useBioStackStore(
    (state) => state.injectionHistory || [],
  );

  const inventory = useBioStackStore(
    (state) => state.inventory || [],
  );

  const notificationInventoryKey = inventory
    .map(({ notificationIds, ...item }) => JSON.stringify(item))
    .join('|');

  const notificationLogKey = injectionHistory
    .map((log) => `${log.id}:${log.timestamp}`)
    .join('|');

  /**
   * Configure the notification system.
   *
   * Native:
   *   Uses expo-notifications.
   *
   * Web:
   *   Uses the web bridge and does nothing for now.
   */
  useEffect(() => {
    try {
      configureNotifications();
    } catch {
      // Notifications are optional.
    }
  }, []);

  /**
   * Initialize existing reminders after startup.
   *
   * The platform-specific bridge decides whether this is supported.
   */
  useEffect(() => {
    let cancelled = false;

    const initializeNotifications = async () => {
      try {
        const permission = await getNotificationPermission();

        if (permission.status !== 'granted') {
          return;
        }

        const currentState = useBioStackStore.getState();

        const currentInventory =
          currentState.inventory || [];

        const currentLogs =
          currentState.injectionHistory || [];

        const idsByInventory =
          await syncScheduleReminders(
            currentInventory,
            currentLogs,
          );

        if (cancelled) {
          return;
        }

        for (const [inventoryId, ids] of idsByInventory.entries()) {
          useBioStackStore
            .getState()
            .setNotificationIds(inventoryId, ids);
        }
      } catch {
        // Notification is optional.
        // Never prevent the tracker from opening.
      }
    };

    void initializeNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Handle notification taps.
   *
   * Native bridge returns schedule information.
   * Web bridge currently returns null.
   */
  useEffect(() => {
    let mounted = true;

    const handleNotificationTarget = (
      target: {
        inventoryId?: string;
        date?: string;
      } | null,
    ) => {
      if (!mounted) {
        return;
      }

      if (target) {
        setNotificationTarget({
          inventoryId: target.inventoryId,
          date: target.date,
        });
      } else {
        setNotificationTarget(null);
      }

      setActiveTab('today');
    };

    const subscription =
      subscribeToNotificationResponse(handleNotificationTarget);

    void getLastNotificationTarget().then((target) => {
      if (target) {
        handleNotificationTarget(target);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  /**
   * Rebuild scheduled reminders whenever inventory configuration
   * or injection history changes.
   *
   * Native:
   *   Rebuilds local iOS notifications.
   *
   * Web:
   *   No-op until browser-compatible scheduling is added.
   */
  useEffect(() => {
    let cancelled = false;

    const syncReminders = async () => {
      try {
        const permission = await getNotificationPermission();

        if (permission.status !== 'granted') {
          return;
        }

        const idsByInventory =
          await syncScheduleReminders(
            inventory,
            injectionHistory,
          );

        if (cancelled) {
          return;
        }

        for (const [inventoryId, ids] of idsByInventory.entries()) {
          useBioStackStore
            .getState()
            .setNotificationIds(inventoryId, ids);
        }
      } catch {
        // Notifications are optional.
      }
    };

    void syncReminders();

    return () => {
      cancelled = true;
    };
  }, [notificationInventoryKey, notificationLogKey]);

  /**
   * Manual notification permission/status button.
   */
  const handleManualNotificationRequest = async () => {
    try {
      const current =
        await getNotificationPermission();

      let finalStatus = current.status;

      if (current.status !== 'granted') {
        const requested =
          await requestNotificationPermission();

        finalStatus = requested.status;
      }

      if (finalStatus === 'granted') {
        Alert.alert(
          'Status Notifikasi',
          'Izin notifikasi sudah AKTIF. BioStack dapat mengirim pengingat jadwal.',
        );
        return;
      }

      if (finalStatus === 'unavailable') {
        Alert.alert(
          'Notifikasi Web',
          'Pengingat notifikasi terjadwal belum tersedia pada versi web BioStack. Data dan tracker tetap dapat digunakan seperti biasa.',
        );
        return;
      }

      Alert.alert(
        'Notifikasi',
        'Izin notifikasi belum aktif.',
      );
    } catch {
      Alert.alert(
        'Gagal',
        'Sistem tidak dapat memproses permintaan notifikasi saat ini.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#030712"
      />

      {/* Header Utama BioStack PRO */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          <View style={styles.brandingRow}>
            <View style={styles.brandIconBox}>
              <Image
                source={require('./icon.png')}
                style={styles.brandIconImage}
                resizeMode="cover"
              />
            </View>

            <View>
              <View style={styles.titleWithBadge}>
                <Text style={styles.appTitle}>
                  BioStack
                </Text>

                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>
                    PRO
                  </Text>
                </View>
              </View>

              <Text style={styles.appSubtitle}>
                Personal Tracker
              </Text>
            </View>
          </View>

          <View style={styles.headerStatus}>
            <ShieldCheck
              size={13}
              color="#34d399"
            />

            <Text style={styles.headerStatusText}>
              LOCAL
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleManualNotificationRequest}
              style={styles.notificationBtn}
              accessibilityLabel="Notification status"
            >
              <Bell
                size={18}
                color="#94a3b8"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setActiveTab('analytics')
              }
              style={styles.notificationBtn}
              accessibilityLabel="Open analytics"
            >
              <TrendingUp
                size={18}
                color={
                  activeTab === 'analytics'
                    ? '#10b981'
                    : '#94a3b8'
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setActiveTab('settings')
              }
              style={styles.notificationBtn}
              accessibilityLabel="Open settings"
            >
              <Settings
                size={18}
                color={
                  activeTab === 'settings'
                    ? '#10b981'
                    : '#94a3b8'
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        {([
          ['today', t('navigation.today'), Activity],
          [
            'inventory',
            t('navigation.inventory'),
            FlaskConical,
          ],
          [
            'rotation',
            t('navigation.rotation'),
            RotateCw,
          ],
          [
            'history',
            t('navigation.history'),
            History,
          ],
          [
            'freezer',
            t('navigation.freezer'),
            Snowflake,
          ],
        ] as const).map(
          ([tab, label, Icon]) => {
            const active = activeTab === tab;

            return (
              <TouchableOpacity
                key={tab}
                style={styles.navTab}
                onPress={() =>
                  setActiveTab(tab)
                }
                accessibilityRole="button"
                accessibilityState={{
                  selected: active,
                }}
                accessibilityLabel={label}
              >
                <View
                  style={[
                    styles.navIconWrap,
                    active &&
                      styles.navIconWrapActive,
                  ]}
                >
                  <Icon
                    size={16}
                    color={
                      active
                        ? COLORS.accent
                        : COLORS.muted
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.navTabText,
                    active &&
                      styles.navTabTextActive,
                  ]}
                >
                  {label}
                </Text>

                {active && (
                  <View
                    style={styles.navActiveDot}
                  />
                )}
              </TouchableOpacity>
            );
          },
        )}
      </View>

      {/* Active Screen */}
      <View style={styles.mainContent}>
        {activeTab === 'today' && (
          <TodayScreen
            onOpenInventory={() =>
              setActiveTab('inventory')
            }
            notificationTarget={
              notificationTarget
            }
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryScreen />
        )}

        {activeTab === 'rotation' && (
          <RotationScreen />
        )}

        {activeTab === 'history' && (
          <HistoryScreen />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsScreen />
        )}

        {activeTab === 'freezer' && (
          <FreezerScreen />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            onDone={() =>
              setActiveTab('today')
            }
          />
        )}
      </View>

      <FloatingAIChat />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BioStackApp />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },

  topHeader: {
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === 'android'
        ? 12
        : 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    backgroundColor: COLORS.bg,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor:
      'rgba(16, 185, 129, 0.3)',
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },

  brandIconImage: {
    width: '100%',
    height: '100%',
  },

  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  appTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },

  proBadge: {
    backgroundColor:
      'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },

  appSubtitle: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 2,
  },

  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor:
      'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(16, 185, 129, 0.2)',
    marginRight: 6,
  },

  headerStatusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#34d399',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  notificationBtn: {
    padding: 8,
    backgroundColor: '#090d16',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  navBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 8,
    gap: 4,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: -8,
    },
    zIndex: 20,
  },

  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 3,
    borderRadius: RADIUS.md,
    minHeight: 52,
    position: 'relative',
  },

  navIconWrap: {
    width: 30,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIconWrapActive: {
    backgroundColor:
      'rgba(16, 185, 129, 0.10)',
  },

  navTabText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.muted,
  },

  navTabTextActive: {
    color: COLORS.accent,
  },

  navActiveDot: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },

  mainContent: {
    flex: 1,
  },
});
