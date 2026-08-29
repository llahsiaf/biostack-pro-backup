import React, { useState, useEffect } from 'react';
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
import * as Notifications from 'expo-notifications';
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
import { COLORS, RADIUS, SHADOWS } from './src/theme';
import { useBioStackStore } from './src/store/useBioStackStore';
import { getNotificationPermission, rebuildScheduleReminders } from './src/utils/notificationUtils';

// Konfigurasi handler notifikasi lokal internal
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'inventory' | 'rotation' | 'history' | 'freezer' | 'analytics' | 'settings'>('today');

  // Mendaftarkan Izin Notifikasi ke Sistem iOS secara otomatis saat startup
  useEffect(() => {
    async function initializeLocalNotifications() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let status = existingStatus;

        if (existingStatus !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              provideAppNotificationSettings: true,
            },
          });
          status = requested.status;
        }

        if (status === 'granted') {
          const inventory = useBioStackStore.getState().inventory || [];
          const idsByInventory = await rebuildScheduleReminders(inventory, 30);
          for (const [inventoryId, ids] of idsByInventory.entries()) {
            useBioStackStore.getState().setNotificationIds(inventoryId, ids);
          }
        }
      } catch (error) {
        // Notification is an optional convenience; tracker remains fully usable without it.
      }
    }

    void initializeLocalNotifications();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      setActiveTab('today');
    });
    return () => subscription.remove();
  }, []);

  // Fungsi Pemicu Izin Manual (Tombol Lonceng)
  const handleManualNotificationRequest = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        Alert.alert('Status Notifikasi', 'Izin notifikasi sudah AKTIF. BioStack akan mengirimkan pengingat jadwal injeksi Anda.');
      } else {
        Alert.alert(
          'Izin Ditolak', 
          'Notifikasi terblokir oleh iOS. Silakan buka Pengaturan > BioStack > izinkan Notifikasi secara manual.'
        );
      }
    } catch (error) {
      Alert.alert('Gagal', 'Sistem tidak dapat memproses permintaan izin saat ini.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* Header Utama BioStack PRO */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          <View style={styles.brandingRow}>
            {/* Memanggil icon.png dari direktori root */}
            <View style={styles.brandIconBox}>
              <Image
                source={require('./icon.png')}
                style={styles.brandIconImage}
                resizeMode="cover"
              />
            </View>
            <View>
              <View style={styles.titleWithBadge}>
                <Text style={styles.appTitle}>BioStack</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.appSubtitle}>Personal Tracker</Text>
            </View>
          </View>

          <View style={styles.headerStatus}>
            <ShieldCheck size={13} color="#34d399" />
            <Text style={styles.headerStatusText}>LOCAL</Text>
          </View>

          {/* Tombol Pemicu Izin Notifikasi Manual */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={handleManualNotificationRequest} 
              style={styles.notificationBtn}
              accessibilityLabel="Status notifikasi"
            >
              <Bell size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('analytics')}
              style={styles.notificationBtn}
              accessibilityLabel="Buka analytics"
            >
              <TrendingUp size={18} color={activeTab === 'analytics' ? '#10b981' : '#94a3b8'} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('settings')} 
              style={styles.notificationBtn}
              accessibilityLabel="Buka pengaturan"
            >
              <Settings size={18} color={activeTab === 'settings' ? '#10b981' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Navigasi Utama — bottom tab bar */}
      <View style={styles.navBar}>
        {([
          ['today', 'Today', Activity],
          ['inventory', 'Inventory', FlaskConical],
          ['rotation', 'Rotasi', RotateCw],
          ['history', 'Riwayat', History],
          ['freezer', 'Freezer', Snowflake],
        ] as const).map(([tab, label, Icon]) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.navTab}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
            >
              <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
                <Icon size={16} color={active ? COLORS.accent : COLORS.muted} />
              </View>
              <Text style={[styles.navTabText, active && styles.navTabTextActive]}>{label}</Text>
              {active && <View style={styles.navActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tampilan Konten Layar Aktif */}
      <View style={styles.mainContent}>
        {activeTab === 'today' && <TodayScreen onOpenInventory={() => setActiveTab('inventory')} />}
        {activeTab === 'inventory' && <InventoryScreen />}
        {activeTab === 'rotation' && <RotationScreen />}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'analytics' && <AnalyticsScreen />}
        {activeTab === 'freezer' && <FreezerScreen />}
        {activeTab === 'settings' && <SettingsScreen onDone={() => setActiveTab('today')} />}
      </View>

      {/* Tombol AI Chat Assistant Melayang */}
      <FloatingAIChat />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
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
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
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
    shadowOffset: { width: 0, height: -8 },
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
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
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
