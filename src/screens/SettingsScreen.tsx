import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ArchiveRestore, CheckCircle2, Download, FileJson, LockKeyhole, RotateCcw, Settings as SettingsIcon, ShieldCheck, Upload, WifiOff } from 'lucide-react-native';
import { useBioStackStore } from '../store/useBioStackStore';
import { buildBackupPayload, exportBackupFile, readBackupFile } from '../utils/backupUtils';
import {
  getNotificationPermission,
  getScheduledNotificationCount,
  rebuildScheduleReminders,
  requestNotificationPermission,
  sendTestNotification,
} from '../utils/notificationUtils';

interface SettingsScreenProps {
  onDone?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onDone }) => {
  const {
    inventory,
    freezerStock,
    injectionHistory,
    currentSite,
    settings,
    updateSettings,
    replaceData,
  } = useBioStackStore();

  const [busy, setBusy] = useState(false);
  const [confirmImportVisible, setConfirmImportVisible] = useState(false);
  const [pendingImportUri, setPendingImportUri] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState('checking');
  const [scheduledNotificationCount, setScheduledNotificationCount] = useState(0);

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      Alert.alert('Gagal', error instanceof Error ? error.message : 'Operasi tidak dapat diselesaikan.');
    } finally {
      setBusy(false);
    }
  };

  const refreshNotifications = async () => {
    const permission = await getNotificationPermission();
    setNotificationStatus(permission.status);
    setScheduledNotificationCount(await getScheduledNotificationCount());
  };

  const handleEnableNotifications = () =>
    run(async () => {
      const permission = await requestNotificationPermission();
      setNotificationStatus(permission.status);
      if (permission.status !== 'granted') {
        Alert.alert('Notifikasi belum aktif', 'iOS belum memberikan izin notifikasi. Aktifkan izin dari Settings iOS lalu jalankan pemeriksaan lagi.');
        return;
      }
      const idsByInventory = await rebuildScheduleReminders(inventory, 30);
      for (const [inventoryId, ids] of idsByInventory.entries()) {
        // The schedule engine owns the list; keep it available for future cancellation/auditing.
        useBioStackStore.getState().setNotificationIds(inventoryId, ids);
      }
      await refreshNotifications();
      Alert.alert('Notifikasi aktif', `Pengingat lokal dijadwalkan untuk ${idsByInventory.size} vial aktif.`);
    });

  const handleTestNotification = () =>
    run(async () => {
      const permission = await requestNotificationPermission();
      setNotificationStatus(permission.status);
      if (permission.status !== 'granted') {
        Alert.alert('Izin diperlukan', 'Izinkan notifikasi di iOS sebelum mengirim test.');
        return;
      }
      await sendTestNotification(10);
      await refreshNotifications();
      Alert.alert('Test dijadwalkan', 'BioStack akan mencoba menampilkan notifikasi lokal sekitar 10 detik dari sekarang.');
    });

  const handleRebuildNotifications = () =>
    run(async () => {
      const permission = await getNotificationPermission();
      setNotificationStatus(permission.status);
      if (permission.status !== 'granted') {
        Alert.alert('Izin diperlukan', 'Aktifkan izin notifikasi terlebih dahulu.');
        return;
      }
      const idsByInventory = await rebuildScheduleReminders(inventory, 30);
      for (const [inventoryId, ids] of idsByInventory.entries()) {
        useBioStackStore.getState().setNotificationIds(inventoryId, ids);
      }
      await refreshNotifications();
      Alert.alert('Reminder diperbarui', 'Semua local reminder BioStack dibangun ulang untuk 30 hari ke depan.');
    });

  React.useEffect(() => {
    void refreshNotifications();
  }, []);

  const handleExport = () =>
    run(async () => {
      const payload = buildBackupPayload({
        inventory,
        freezerStock,
        injectionHistory,
        currentSite,
        settings: settings || { allowAiNetwork: false, aiProvider: 'gemini' },
      });
      await exportBackupFile(payload);
      Alert.alert('Backup siap', 'File backup BioStack telah dibuat. Simpan di lokasi yang aman.');
    });

  const handlePickImport = () =>
    run(async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      const validation = await readBackupFile(result.assets[0].uri);
      if (!validation.valid || !validation.payload) {
        Alert.alert('Backup tidak valid', validation.error || 'File bukan backup BioStack yang valid.');
        return;
      }

      setPendingImportUri(result.assets[0].uri);
      setConfirmImportVisible(true);
    });

  const confirmImport = () => {
    if (!pendingImportUri) return;
    run(async () => {
      const validation = await readBackupFile(pendingImportUri);
      if (!validation.valid || !validation.payload) {
        Alert.alert('Import dibatalkan', validation.error || 'Backup tidak valid.');
        return;
      }

      replaceData(validation.payload.data);
      setPendingImportUri(null);
      setConfirmImportVisible(false);
      Alert.alert('Restore selesai', 'Data dari backup sudah dimuat. Aplikasi sekarang menggunakan isi backup tersebut.');
    });
  };

  const handleReset = () => {
    Alert.alert(
      'Reset data lokal?',
      'Ini akan menghapus inventory, freezer, dan history dari perangkat ini. Backup yang sudah diekspor tidak akan terhapus.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () =>
            run(async () => {
              replaceData({
                inventory: [],
                freezerStock: [],
                injectionHistory: [],
                currentSite: 'KA',
                settings: { allowAiNetwork: false, aiProvider: 'gemini' },
              });
              Alert.alert('Selesai', 'Data lokal BioStack sudah di-reset.');
            }),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><SettingsIcon size={20} color="#10b981" /></View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>APP SETTINGS</Text>
            <Text style={styles.title}>Pengaturan BioStack</Text>
            <Text style={styles.subtitle}>Backup, privacy, dan kontrol data lokal.</Text>
          </View>
          {onDone && (
            <TouchableOpacity onPress={onDone} style={styles.doneBtn}>
              <CheckCircle2 size={16} color="#10b981" />
            </TouchableOpacity>
          )}
        </View>

        <SectionTitle icon={<ArchiveRestore size={16} color="#38bdf8" />} title="Backup & Restore" />
        <View style={styles.card}>
          <Row
            icon={<Download size={18} color="#38bdf8" />}
            title="Ekspor seluruh data"
            desc="Membuat satu file JSON berisi inventory, freezer, history, rotasi, dan pengaturan tracker."
            buttonLabel={busy ? 'Memproses…' : 'Ekspor Backup'}
            onPress={handleExport}
            disabled={busy}
          />
          <Divider />
          <Row
            icon={<Upload size={18} color="#10b981" />}
            title="Restore dari backup"
            desc="Pilih file BioStack JSON untuk mengganti data lokal dengan checkpoint yang kamu simpan."
            buttonLabel={busy ? 'Memproses…' : 'Pilih File'}
            onPress={handlePickImport}
            disabled={busy}
          />
          <View style={styles.warningBox}>
            <FileJson size={15} color="#f59e0b" />
            <Text style={styles.warningText}>Restore akan mengganti data lokal saat ini. Ekspor backup terbaru sebelum melakukan restore.</Text>
          </View>
        </View>

        <SectionTitle icon={<Bell size={16} color="#f59e0b" />} title="Local Notifications" />
        <View style={styles.card}>
          <View style={styles.notificationStatusRow}>
            <View style={styles.statusCopy}>
              <Text style={styles.rowTitle}>Status</Text>
              <Text style={styles.rowDesc}>
                {notificationStatus === 'granted'
                  ? `Authorized • ${scheduledNotificationCount} reminder terjadwal`
                  : notificationStatus === 'denied'
                    ? 'Denied / blocked oleh iOS'
                    : notificationStatus === 'checking'
                      ? 'Memeriksa izin…'
                      : 'Belum diaktifkan'}
              </Text>
            </View>
            <View style={[styles.statusPill, notificationStatus === 'granted' && styles.statusPillOk]}>
              <Text style={[styles.statusPillText, notificationStatus === 'granted' && styles.statusPillTextOk]}>
                {notificationStatus === 'granted' ? 'READY' : 'OFF'}
              </Text>
            </View>
          </View>
          <Text style={styles.notificationHint}>
            BioStack memakai local notifications. Tidak membutuhkan server atau push notification; reminder dibuat dari schedule yang tersimpan di perangkat.
          </Text>
          <View style={styles.notificationActions}>
            <TouchableOpacity onPress={handleEnableNotifications} disabled={busy} style={styles.notificationActionPrimary}>
              <Bell size={14} color="#052e16" />
              <Text style={styles.notificationActionPrimaryText}>Aktifkan & Jadwalkan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTestNotification} disabled={busy} style={styles.notificationActionSecondary}>
              <Text style={styles.notificationActionSecondaryText}>Test 10 dtk</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleRebuildNotifications} disabled={busy} style={styles.rebuildBtn}>
            <RotateCcw size={14} color="#f59e0b" />
            <Text style={styles.rebuildText}>Rebuild Reminder 30 Hari</Text>
          </TouchableOpacity>
        </View>

        <SectionTitle icon={<ShieldCheck size={16} color="#10b981" />} title="Privacy" />
        <View style={styles.card}>
          <View style={styles.privacyRow}>
            <View style={styles.iconCircle}><WifiOff size={17} color={settings?.allowAiNetwork ? '#64748b' : '#10b981'} /></View>
            <View style={styles.privacyCopy}>
              <Text style={styles.rowTitle}>Izinkan koneksi AI online</Text>
              <Text style={styles.rowDesc}>
                Default OFF. Saat aktif, pesan yang kamu kirim ke AI dapat dikirim ke provider yang dipilih di pengaturan AI.
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="switch"
              accessibilityState={{ checked: Boolean(settings?.allowAiNetwork) }}
              onPress={() => updateSettings({ allowAiNetwork: !settings?.allowAiNetwork })}
              style={[styles.switch, settings?.allowAiNetwork && styles.switchOn]}
            >
              <View style={[styles.switchKnob, settings?.allowAiNetwork && styles.switchKnobOn]} />
            </TouchableOpacity>
          </View>
          <View style={styles.secureNote}>
            <LockKeyhole size={15} color="#94a3b8" />
            <Text style={styles.secureNoteText}>API key AI tidak ikut dimasukkan ke file backup BioStack.</Text>
          </View>
        </View>

        <SectionTitle icon={<RotateCcw size={16} color="#f59e0b" />} title="Data lokal" />
        <View style={styles.card}>
          <View style={styles.statsGrid}>
            <Stat label="Vial aktif/arsip" value={String(inventory.length)} />
            <Stat label="Freezer records" value={String(freezerStock.length)} />
            <Stat label="Injection logs" value={String(injectionHistory.length)} />
            <Stat label="Format backup" value="v1" />
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <RotateCcw size={15} color="#fca5a5" />
            <Text style={styles.resetText}>Reset Data Lokal</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>BioStack backup schema v5 • Data tracker tetap berada di perangkat kecuali fitur online AI diizinkan.</Text>
        </View>
      </ScrollView>

      <Modal visible={confirmImportVisible} transparent animationType="fade" onRequestClose={() => setConfirmImportVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <ArchiveRestore size={22} color="#f59e0b" />
            <Text style={styles.confirmTitle}>Konfirmasi Restore</Text>
            <Text style={styles.confirmText}>Data lokal sekarang akan digantikan oleh isi backup. Pastikan kamu sudah punya salinan data saat ini.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={() => { setConfirmImportVisible(false); setPendingImportUri(null); }} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmImport} style={styles.primaryBtn} disabled={busy}>
                <Text style={styles.primaryText}>Restore</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <View style={styles.sectionTitle}><View style={styles.sectionIcon}>{icon}</View><Text style={styles.sectionTitleText}>{title}</Text></View>
);

const Row = ({ icon, title, desc, buttonLabel, onPress, disabled }: {
  icon: React.ReactNode; title: string; desc: string; buttonLabel: string; onPress: () => void; disabled?: boolean;
}) => (
  <View style={styles.row}>
    <View style={styles.iconCircle}>{icon}</View>
    <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDesc}>{desc}</Text></View>
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}><Text style={styles.actionText}>{buttonLabel}</Text></TouchableOpacity>
  </View>
);

const Divider = () => <View style={styles.divider} />;
const Stat = ({ label, value }: { label: string; value: string }) => <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#030712'},
  content:{padding:16,paddingBottom:40},
  hero:{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:16,backgroundColor:'#090d16',borderWidth:1,borderColor:'#1e293b',marginBottom:16},
  heroIcon:{width:40,height:40,borderRadius:12,backgroundColor:'rgba(16,185,129,.10)',alignItems:'center',justifyContent:'center'},
  heroCopy:{flex:1},
  eyebrow:{fontSize:9,fontWeight:'800',letterSpacing:1.2,color:'#64748b'},
  title:{fontSize:19,fontWeight:'900',color:'#fff',marginTop:3},
  subtitle:{fontSize:11,color:'#94a3b8',marginTop:2},
  doneBtn:{padding:8,borderRadius:10,backgroundColor:'#0f172a',borderWidth:1,borderColor:'#1e293b'},
  sectionTitle:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8,marginTop:6},
  sectionIcon:{width:28,height:28,borderRadius:8,backgroundColor:'#090d16',alignItems:'center',justifyContent:'center'},
  sectionTitleText:{fontSize:13,fontWeight:'900',color:'#e2e8f0'},
  card:{backgroundColor:'#090d16',borderWidth:1,borderColor:'#1e293b',borderRadius:16,padding:14,marginBottom:14},
  row:{flexDirection:'row',alignItems:'center',gap:10},
  iconCircle:{width:34,height:34,borderRadius:10,backgroundColor:'#0f172a',alignItems:'center',justifyContent:'center'},
  rowCopy:{flex:1},
  rowTitle:{fontSize:12,fontWeight:'800',color:'#fff'},
  rowDesc:{fontSize:10,color:'#64748b',lineHeight:15,marginTop:3},
  actionBtn:{paddingHorizontal:10,paddingVertical:9,borderRadius:9,backgroundColor:'rgba(56,189,248,.10)',borderWidth:1,borderColor:'rgba(56,189,248,.35)'},
  actionBtnDisabled:{opacity:.5},
  actionText:{fontSize:9,fontWeight:'900',color:'#38bdf8'},
  divider:{height:1,backgroundColor:'#111827',marginVertical:14},
  warningBox:{flexDirection:'row',gap:8,marginTop:12,padding:10,borderRadius:10,backgroundColor:'rgba(245,158,11,.07)',borderWidth:1,borderColor:'rgba(245,158,11,.18)'},
  warningText:{flex:1,fontSize:9,color:'#cbd5e1',lineHeight:14},
  notificationStatusRow:{flexDirection:'row',alignItems:'center',gap:10},
  statusCopy:{flex:1},
  statusPill:{paddingHorizontal:8,paddingVertical:5,borderRadius:8,backgroundColor:'#1e293b',borderWidth:1,borderColor:'#334155'},
  statusPillOk:{backgroundColor:'rgba(16,185,129,.10)',borderColor:'rgba(16,185,129,.3)'},
  statusPillText:{fontSize:8,fontWeight:'900',letterSpacing:1,color:'#94a3b8'},
  statusPillTextOk:{color:'#34d399'},
  notificationHint:{fontSize:9,color:'#64748b',lineHeight:14,marginTop:10},
  notificationActions:{flexDirection:'row',gap:8,marginTop:12},
  notificationActionPrimary:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:10,borderRadius:10,backgroundColor:'#10b981'},
  notificationActionPrimaryText:{fontSize:9,fontWeight:'900',color:'#052e16'},
  notificationActionSecondary:{paddingHorizontal:12,paddingVertical:10,borderRadius:10,backgroundColor:'#0f172a',borderWidth:1,borderColor:'#334155'},
  notificationActionSecondaryText:{fontSize:9,fontWeight:'900',color:'#cbd5e1'},
  rebuildBtn:{marginTop:8,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:10,borderRadius:10,borderWidth:1,borderColor:'rgba(245,158,11,.25)',backgroundColor:'rgba(245,158,11,.06)'},
  rebuildText:{fontSize:9,fontWeight:'900',color:'#fbbf24'},
  privacyRow:{flexDirection:'row',alignItems:'center',gap:10},
  privacyCopy:{flex:1},
  switch:{width:42,height:24,borderRadius:12,backgroundColor:'#1e293b',justifyContent:'center',paddingHorizontal:3},
  switchOn:{backgroundColor:'#047857'},
  switchKnob:{width:18,height:18,borderRadius:9,backgroundColor:'#94a3b8'},
  switchKnobOn:{alignSelf:'flex-end',backgroundColor:'#ecfdf5'},
  secureNote:{flexDirection:'row',gap:7,alignItems:'center',paddingTop:12},
  secureNoteText:{flex:1,fontSize:9,color:'#64748b'},
  statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  stat:{width:'48%',padding:10,borderRadius:12,backgroundColor:'#0f172a',borderWidth:1,borderColor:'#1e293b'},
  statValue:{fontSize:16,fontWeight:'900',color:'#fff'},
  statLabel:{fontSize:9,color:'#64748b',marginTop:3},
  resetBtn:{marginTop:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,paddingVertical:11,borderRadius:10,borderWidth:1,borderColor:'rgba(239,68,68,.3)',backgroundColor:'rgba(239,68,68,.06)'},
  resetText:{fontSize:10,fontWeight:'900',color:'#fca5a5'},
  versionText:{fontSize:8,color:'#475569',textAlign:'center',marginTop:10,lineHeight:13},
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,.72)',alignItems:'center',justifyContent:'center',padding:20},
  confirmCard:{width:'100%',maxWidth:390,borderRadius:18,padding:18,backgroundColor:'#090d16',borderWidth:1,borderColor:'#334155'},
  confirmTitle:{fontSize:16,fontWeight:'900',color:'#fff',marginTop:10},
  confirmText:{fontSize:11,color:'#94a3b8',lineHeight:17,marginTop:6},
  confirmActions:{flexDirection:'row',gap:8,marginTop:16},
  secondaryBtn:{flex:1,paddingVertical:11,borderRadius:10,alignItems:'center',backgroundColor:'#0f172a',borderWidth:1,borderColor:'#1e293b'},
  secondaryText:{fontSize:10,fontWeight:'900',color:'#94a3b8'},
  primaryBtn:{flex:1,paddingVertical:11,borderRadius:10,alignItems:'center',backgroundColor:'#10b981'},
  primaryText:{fontSize:10,fontWeight:'900',color:'#022c22'},
});
