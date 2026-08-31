import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Snowflake,
  Plus,
  Search,
  Trash2,
  FlaskConical,
  X,
  ArrowRight,
} from 'lucide-react-native';
import { useBioStackStore, FreezerItem } from '../store/useBioStackStore';

export const FreezerScreen: React.FC = () => {
  const {
    freezerStock,
    updateFreezerQuantity,
    removeFreezerItem,
    addFreezerItem,
    reconstituteToFridge,
    transferLiquidToFridge,
  } = useBioStackStore();

  const [searchQuery, setSearchQuery] = useState('');

  // =========================
  // MODAL TAMBAH PEPTIDA
  // =========================
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState(
    'Tissue Repair & Recovery'
  );
  const [newVialSize, setNewVialSize] = useState('10');
  const [newUnit, setNewUnit] = useState<'mg' | 'mcg' | 'mL'>('mg');
  const [newQuantity, setNewQuantity] = useState('5');
  const [newDefaultBac, setNewDefaultBac] = useState('2.0');
  const [newTargetDose, setNewTargetDose] = useState('2.0');
  const [newFrequency, setNewFrequency] = useState('weekly');
  const [newFrequencyLabel, setNewFrequencyLabel] = useState(
    'Mingguan (Weekly)'
  );
  const [newHalfLife, setNewHalfLife] = useState('7');
  const [newMaxFridgeDays, setNewMaxFridgeDays] = useState('56');

  // =========================
  // MODAL PELARUTAN
  // =========================
  const [selectedFreezerItem, setSelectedFreezerItem] =
    useState<FreezerItem | null>(null);
  const [isReconstituteModalOpen, setIsReconstituteModalOpen] =
    useState(false);
  const [bacWaterInput, setBacWaterInput] = useState('2.0');

  const stockList = freezerStock || [];

  const totalVials = stockList.reduce(
    (acc, curr) => acc + (curr.quantity || 0),
    0
  );

  const filteredStock = stockList.filter((item) => {
    const query = searchQuery.toLowerCase();

    return (
      item?.name?.toLowerCase().includes(query) ||
      item?.category?.toLowerCase().includes(query)
    );
  });

  // =========================
  // AKSI ITEM
  // =========================
  const handleActionOnItem = (item: FreezerItem) => {
    if (item.quantity <= 0) {
      Alert.alert(
        'Stok Habis',
        `Stok ${item.name} di freezer sudah 0. Tambah stok terlebih dahulu.`
      );
      return;
    }

    // Cairan mL langsung dipindahkan ke kulkas
    if (item.unit === 'mL') {
      Alert.alert(
        'Pindahkan ke Kulkas',
        `${item.name} adalah senyawa cairan siap pakai (${item.vialSize} mL). Pindahkan 1 vial langsung ke kulkas aktif tanpa pelarutan BAC Water?`,
        [
          {
            text: 'Batal',
            style: 'cancel',
          },
          {
            text: 'Pindahkan',
            onPress: () => {
              transferLiquidToFridge(item.id);

              Alert.alert(
                'Berhasil',
                `${item.name} berhasil dipindahkan ke kulkas aktif.`
              );
            },
          },
        ]
      );

      return;
    }

    // Bubuk mg / mcg membuka modal pelarutan
    setSelectedFreezerItem(item);
    setBacWaterInput(
      (item.defaultBacWater || 2.0).toString()
    );
    setIsReconstituteModalOpen(true);
  };

  // =========================
  // KONFIRMASI PELARUTAN
  // =========================
  const handleConfirmReconstitute = () => {
    if (!selectedFreezerItem) return;

    const bac = parseFloat(bacWaterInput) || 2.0;

    reconstituteToFridge(
      selectedFreezerItem.id,
      bac
    );

    setIsReconstituteModalOpen(false);

    Alert.alert(
      'Pelarutan Selesai',
      `1 vial ${selectedFreezerItem.name} berhasil dilarutkan dengan ${bac} mL BAC Water dan dimasukkan ke kulkas aktif.`
    );
  };

  // =========================
  // TAMBAH PEPTIDA BARU
  // =========================
  const handleAddNewPeptide = () => {
    if (!newName.trim()) {
      Alert.alert(
        'Peringatan',
        'Harap masukkan nama peptida.'
      );
      return;
    }

    const newItem: FreezerItem = {
      id: `pep-${Date.now()}`,
      name: newName.trim(),
      category:
        newCategory.trim() || 'General Peptide',
      vialSize:
        parseFloat(newVialSize) || 10,
      unit: newUnit,
      quantity:
        parseInt(newQuantity, 10) || 1,
      defaultBacWater:
        newUnit === 'mL'
          ? 0
          : parseFloat(newDefaultBac) || 2.0,
      targetDose:
        parseFloat(newTargetDose) || 1.0,
      frequency: newFrequency,
      frequencyLabel: newFrequencyLabel,
      halfLifeDays:
        parseFloat(newHalfLife) || 7,
      maxFridgeDays:
        parseInt(newMaxFridgeDays, 10) || 56,
      activeDays: ['Sen'],
      injectionTime: '08:00',
    };

    addFreezerItem(newItem);

    setIsAddModalOpen(false);

    // Reset form
    setNewName('');
    setNewVialSize('10');
    setNewQuantity('5');

    Alert.alert(
      'Sukses',
      `${newItem.name} berhasil ditambahkan ke Freezer.`
    );
  };

  return (
    <View style={styles.container}>

      {/* =====================================
          BANNER FREEZER
      ===================================== */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerIconBox}>
          <Snowflake
            size={21}
            color="#38bdf8"
          />
        </View>

        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>
            Freezer Lyophilized Stock
          </Text>

          <Text style={styles.bannerSubtitle}>
            {stockList.length} Senyawa • {totalVials} Vial Padat Terkunci
          </Text>
        </View>
      </View>

      {/* =====================================
          TAMBAH PEPTIDA
      ===================================== */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsAddModalOpen(true)}
        style={styles.addMainBtn}
      >
        <Plus
          size={18}
          color="#022c22"
        />

        <Text style={styles.addMainBtnText}>
          Tambah Peptida Baru
        </Text>
      </TouchableOpacity>

      {/* =====================================
          SEARCH
      ===================================== */}
      <View style={styles.searchBar}>
        <Search
          size={18}
          color="#64748b"
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Cari peptida dalam freezer..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSearchQuery('')}
          >
            <X
              size={17}
              color="#64748b"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* =====================================
          DAFTAR FREEZER
      ===================================== */}
      <FlatList
        data={filteredStock}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"

        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Snowflake
              size={34}
              color="#64748b"
            />

            <Text style={styles.emptyTitle}>
              Tidak Ditemukan Peptida
            </Text>

            <Text style={styles.emptySub}>
              Tidak ada stok freezer yang cocok
              dengan pencarian.
            </Text>
          </View>
        }

        renderItem={({ item }) => {
          const isLiquid = item.unit === 'mL';

          return (
            <View style={styles.freezerCard}>

              {/* =================================
                  HEADER CARD
              ================================= */}
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  <Text
                    style={styles.peptideName}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <View style={styles.sizeBadge}>
                    <Text style={styles.sizeBadgeText}>
                      {item.vialSize} {item.unit}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Alert.alert(
                      'Hapus Senyawa',
                      `Hapus ${item.name} dari freezer?`,
                      [
                        {
                          text: 'Batal',
                          style: 'cancel',
                        },
                        {
                          text: 'Hapus',
                          style: 'destructive',
                          onPress: () =>
                            removeFreezerItem(item.id),
                        },
                      ]
                    );
                  }}
                  style={styles.deleteBtn}
                >
                  <Trash2
                    size={18}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {/* =================================
                  CATEGORY
              ================================= */}
              <Text style={styles.categoryText}>
                {item.category}
              </Text>

              {/* =================================
                  ACTION ROW
              ================================= */}
              <View style={styles.actionRow}>

                {/* QUANTITY */}
                <View style={styles.qtyControl}>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      updateFreezerQuantity(
                        item.id,
                        Math.max(
                          0,
                          item.quantity - 1
                        )
                      )
                    }
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>
                      −
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.qtyValueText}>
                    {item.quantity}{' '}
                    <Text style={styles.qtyUnitText}>
                      Vial
                    </Text>
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      updateFreezerQuantity(
                        item.id,
                        item.quantity + 1
                      )
                    }
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>
                      +
                    </Text>
                  </TouchableOpacity>

                </View>

                {/* ACTION */}
                {isLiquid ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      handleActionOnItem(item)
                    }
                    style={styles.transferActionBtn}
                  >
                    <ArrowRight
                      size={16}
                      color="#022c22"
                    />

                    <Text
                      style={styles.reconstituteBtnText}
                      numberOfLines={1}
                    >
                      Pindahkan ke Kulkas
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      handleActionOnItem(item)
                    }
                    style={styles.reconstituteBtn}
                  >
                    <FlaskConical
                      size={16}
                      color="#022c22"
                    />

                    <Text
                      style={styles.reconstituteBtnText}
                      numberOfLines={1}
                    >
                      Larutkan ke Kulkas
                    </Text>
                  </TouchableOpacity>
                )}

              </View>
            </View>
          );
        }}
      />

      {/* =====================================
          MODAL PELARUTAN
      ===================================== */}
      <Modal
        visible={isReconstituteModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setIsReconstituteModalOpen(false)
        }
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <FlaskConical
                  size={19}
                  color="#10b981"
                />

                <Text style={styles.modalHeading}>
                  Pelarutan Peptida
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setIsReconstituteModalOpen(false)
                }
              >
                <X
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {selectedFreezerItem && (
              <ScrollView
                contentContainerStyle={
                  styles.reconstituteBody
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >

                <Text style={styles.reconPeptideName}>
                  {selectedFreezerItem.name} (
                  {selectedFreezerItem.vialSize}{' '}
                  {selectedFreezerItem.unit})
                </Text>

                <Text style={styles.reconPeptideDesc}>
                  Masukkan volume Bacteriostatic
                  (BAC) Water yang akan disuntikkan
                  ke dalam vial bubuk.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Volume BAC Water (mL):
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={bacWaterInput}
                    onChangeText={setBacWaterInput}
                    placeholder="Contoh: 2.0"
                    placeholderTextColor="#64748b"
                  />
                </View>

                {parseFloat(bacWaterInput) > 0 && (
                  <View style={styles.reconPreviewBox}>

                    <Text style={styles.reconPreviewTitle}>
                      Hasil Konsentrasi Larutan:
                    </Text>

                    <Text style={styles.reconPreviewVal}>
                      {(
                        selectedFreezerItem.vialSize /
                        parseFloat(bacWaterInput)
                      ).toFixed(2)}{' '}
                      {selectedFreezerItem.unit}/mL
                    </Text>

                    <Text style={styles.reconPreviewSub}>
                      Target dosis{' '}
                      {selectedFreezerItem.targetDose}{' '}
                      {selectedFreezerItem.unit} ={' '}
                      {(
                        (
                          selectedFreezerItem.targetDose /
                          (
                            selectedFreezerItem.vialSize /
                            parseFloat(bacWaterInput)
                          )
                        ) * 100
                      ).toFixed(0)}{' '}
                      IU pada spuit U-100.
                    </Text>

                  </View>
                )}

                <View style={styles.modalActionsRow}>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      setIsReconstituteModalOpen(false)
                    }
                    style={styles.modalCancelBtn}
                  >
                    <Text style={styles.modalCancelBtnText}>
                      Batal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmReconstitute}
                    style={styles.modalSaveBtn}
                  >
                    <Text style={styles.modalSaveBtnText}>
                      Larutkan & Masukkan Kulkas
                    </Text>
                  </TouchableOpacity>

                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* =====================================
          MODAL TAMBAH PEPTIDA
      ===================================== */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setIsAddModalOpen(false)
        }
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          style={styles.modalOverlay}
        >
          <View style={styles.modalLargeBox}>

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Plus
                  size={19}
                  color="#10b981"
                />

                <Text style={styles.modalHeading}>
                  Tambah Peptida ke Freezer
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  setIsAddModalOpen(false)
                }
              >
                <X
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={
                styles.addModalBody
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Nama Peptida / Senyawa:
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Semaglutide"
                  placeholderTextColor="#64748b"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Kategori / Deskripsi Medis:
                </Text>

                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: GLP-1 Receptor Agonist"
                  placeholderTextColor="#64748b"
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
              </View>

              {/* UKURAN + SATUAN */}
              <View style={styles.twoColRow}>

                <View style={styles.colBox}>
                  <Text style={styles.inputLabel}>
                    Ukuran Vial:
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={newVialSize}
                    onChangeText={setNewVialSize}
                  />
                </View>

                <View style={styles.colBox}>
                  <Text style={styles.inputLabel}>
                    Satuan:
                  </Text>

                  <View style={styles.unitSelectorRow}>
                    {(
                      ['mg', 'mcg', 'mL'] as (
                        | 'mg'
                        | 'mcg'
                        | 'mL'
                      )[]
                    ).map((u) => (
                      <TouchableOpacity
                        key={u}
                        activeOpacity={0.8}
                        onPress={() =>
                          setNewUnit(u)
                        }
                        style={[
                          styles.unitChip,
                          newUnit === u &&
                            styles.unitChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitChipText,
                            newUnit === u &&
                              styles.unitChipTextActive,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

              </View>

              {/* STOK + BAC WATER */}
              <View style={styles.twoColRow}>

                <View style={styles.colBox}>
                  <Text style={styles.inputLabel}>
                    Jumlah Stok (Vial):
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                  />
                </View>

                {newUnit !== 'mL' && (
                  <View style={styles.colBox}>
                    <Text style={styles.inputLabel}>
                      Default BAC Water (mL):
                    </Text>

                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={newDefaultBac}
                      onChangeText={setNewDefaultBac}
                    />
                  </View>
                )}

              </View>

              {/* TARGET DOSIS */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Target Dosis Default ({newUnit}):
                </Text>

                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={newTargetDose}
                  onChangeText={setNewTargetDose}
                />
              </View>

              <View style={styles.modalActionsRow}>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setIsAddModalOpen(false)
                  }
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelBtnText}>
                    Batal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddNewPeptide}
                  style={styles.modalSaveBtn}
                >
                  <Text style={styles.modalSaveBtnText}>
                    Simpan ke Freezer
                  </Text>
                </TouchableOpacity>

              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  // =====================================
  // BASE
  // =====================================
  container: {
    flex: 1,
    backgroundColor: '#030712',
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  // =====================================
  // BANNER
  // =====================================
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 11,
    marginBottom: 10,
  },

  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  bannerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },

  // =====================================
  // ADD BUTTON
  // =====================================
  addMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 13,
    marginBottom: 10,
  },

  addMainBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#022c22',
  },

  // =====================================
  // SEARCH
  // =====================================
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 11,
    paddingHorizontal: 13,
    minHeight: 44,
    gap: 9,
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    paddingVertical: 0,
  },

  // =====================================
  // LIST
  // =====================================
  listContainer: {
    paddingBottom: 104,
    gap: 10,
  },

  emptyCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 15,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 9,
    marginTop: 20,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  emptySub: {
    fontSize: 10,
    lineHeight: 15,
    color: '#64748b',
    textAlign: 'center',
  },

  // =====================================
  // FREEZER CARD
  // =====================================
  freezerCard: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },

  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 5,
  },

  peptideName: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  sizeBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  sizeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
  },

  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  categoryText: {
    fontSize: 9,
    lineHeight: 12,
    color: '#64748b',
  },

  // =====================================
  // ACTION ROW
  // =====================================
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 1,
  },

  // =====================================
  // QUANTITY
  // =====================================
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 112,
    height: 34,
    backgroundColor: '#030712',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 2,
  },

  qtyBtn: {
    width: 31,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },

  qtyBtnText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '800',
    color: '#94a3b8',
  },

  qtyValueText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },

  qtyUnitText: {
    fontSize: 8,
    fontWeight: '400',
    color: '#64748b',
  },

  // =====================================
  // ACTION BUTTON
  // =====================================
  reconstituteBtn: {
    flex: 1,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  transferActionBtn: {
    flex: 1,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38bdf8',
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  reconstituteBtnText: {
    flexShrink: 1,
    fontSize: 9,
    fontWeight: '800',
    color: '#022c22',
  },

  // =====================================
  // MODAL
  // =====================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  modalBox: {
    backgroundColor: '#090d16',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    maxHeight: '85%',
  },

  modalLargeBox: {
    backgroundColor: '#090d16',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '88%',
    padding: 16,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    paddingBottom: 13,
  },

  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  modalHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  reconstituteBody: {
    paddingTop: 13,
    gap: 11,
  },

  addModalBody: {
    paddingTop: 13,
    gap: 11,
    paddingBottom: 4,
  },

  reconPeptideName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
  },

  reconPeptideDesc: {
    fontSize: 10,
    lineHeight: 15,
    color: '#94a3b8',
  },

  inputGroup: {
    gap: 5,
  },

  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  textInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 9,
    minHeight: 42,
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 12,
  },

  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },

  colBox: {
    flex: 1,
    gap: 5,
  },

  unitSelectorRow: {
    flexDirection: 'row',
    gap: 5,
  },

  unitChip: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    minHeight: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unitChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10b981',
  },

  unitChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },

  unitChipTextActive: {
    color: '#10b981',
  },

  // =====================================
  // RECON PREVIEW
  // =====================================
  reconPreviewBox: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.30)',
    borderRadius: 11,
    padding: 11,
    gap: 3,
  },

  reconPreviewTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },

  reconPreviewVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },

  reconPreviewSub: {
    fontSize: 9,
    lineHeight: 14,
    color: '#64748b',
  },

  // =====================================
  // MODAL ACTIONS
  // =====================================
  modalActionsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 7,
  },

  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },

  modalSaveBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#022c22',
  },
});
