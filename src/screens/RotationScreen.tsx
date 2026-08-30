import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Text as SvgText,
  G,
  Line,
} from 'react-native-svg';
import {
  RotateCw,
  Compass,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import {
  useBioStackStore,
  ROTATION_SITES,
} from '../store/useBioStackStore';

type BodyZone =
  | 'perut'
  | 'paha'
  | 'lengan'
  | 'bokong';

interface SitePoint {
  id: string;
  code: string;
  name: string;
  subText: string;
  zone: BodyZone;
}

const ALL_SITES: SitePoint[] = [
  // Zona Perut
  {
    id: 'KA',
    code: 'KA',
    name: 'Kanan Atas (KA)',
    subText:
      'Perut kanan atas (2-3 cm dari pusar)',
    zone: 'perut',
  },
  {
    id: 'KiA',
    code: 'KiA',
    name: 'Kiri Atas (KiA)',
    subText:
      'Perut kiri atas (2-3 cm dari pusar)',
    zone: 'perut',
  },
  {
    id: 'KB',
    code: 'KB',
    name: 'Kanan Bawah (KB)',
    subText:
      'Perut kanan bawah (2-3 cm dari pusar)',
    zone: 'perut',
  },
  {
    id: 'KiB',
    code: 'KiB',
    name: 'Kiri Bawah (KiB)',
    subText:
      'Perut kiri bawah (2-3 cm dari pusar)',
    zone: 'perut',
  },

  // Zona Paha
  {
    id: 'PKi',
    code: 'PKi',
    name: 'Paha Kiri (PKi)',
    subText:
      'Sisi luar paha atas kiri',
    zone: 'paha',
  },
  {
    id: 'PKn',
    code: 'PKn',
    name: 'Paha Kanan (PKn)',
    subText:
      'Sisi luar paha atas kanan',
    zone: 'paha',
  },

  // Zona Lengan
  {
    id: 'LKi',
    code: 'LKi',
    name: 'Lengan Kiri (LKi)',
    subText:
      'Trisep / sisi belakang lengan kiri',
    zone: 'lengan',
  },
  {
    id: 'LKn',
    code: 'LKn',
    name: 'Lengan Kanan (LKn)',
    subText:
      'Trisep / sisi belakang lengan kanan',
    zone: 'lengan',
  },

  // Zona Bokong
  {
    id: 'BKi',
    code: 'BKi',
    name: 'Bokong Kiri (BKi)',
    subText:
      'Kuadran atas luar bokong kiri',
    zone: 'bokong',
  },
  {
    id: 'BKn',
    code: 'BKn',
    name: 'Bokong Kanan (BKn)',
    subText:
      'Kuadran atas luar bokong kanan',
    zone: 'bokong',
  },
];

export const RotationScreen: React.FC = () => {
  const {
    currentSite,
    setSite,
    rotateToNextSite,
    injectionHistory,
  } = useBioStackStore();

  const [selectedZone, setSelectedZone] =
    useState<BodyZone>('perut');

  const currentPoint =
    ALL_SITES.find(
      (s) => s.id === currentSite,
    ) || ALL_SITES[0];

  const activeZoneSites =
    ALL_SITES.filter(
      (s) => s.zone === selectedZone,
    );

  const getSiteLastUsed = (
    siteId: string,
  ) => {
    const history = Array.isArray(
      injectionHistory,
    )
      ? injectionHistory
      : [];

    const log = history.find(
      (h) => h?.siteId === siteId,
    );

    if (!log) {
      return 'Belum ada log';
    }

    return log.timestamp || 'Baru saja';
  };

  const handleNextRotation = () => {
    rotateToNextSite();
  };

  const siteFill = (
    siteId: string,
  ) =>
    currentSite === siteId
      ? 'rgba(16, 185, 129, 0.20)'
      : '#0f172a';

  const siteStroke = (
    siteId: string,
  ) =>
    currentSite === siteId
      ? '#10b981'
      : '#334155';

  const siteStrokeWidth = (
    siteId: string,
  ) =>
    currentSite === siteId ? 2.5 : 1;

  const siteText = (
    siteId: string,
  ) =>
    currentSite === siteId
      ? '#10b981'
      : '#ffffff';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.scrollContent
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Banner Protokol */}
      <View
        style={styles.bannerCard}
      >
        <View
          style={
            styles.bannerIconBox
          }
        >
          <Compass
            size={20}
            color="#10b981"
          />
        </View>

        <View
          style={styles.bannerContent}
        >
          <Text
            style={styles.bannerTitle}
          >
            Protokol Rotasi Anatomi
          </Text>

          <Text
            style={styles.bannerDesc}
          >
            Mencegah lipohipertrofi dan
            penumpukan jaringan parut
            subkutan.
          </Text>
        </View>
      </View>

      {/* Kartu Target Titik Aktif */}
      <View
        style={
          styles.activeTargetCard
        }
      >
        <View
          style={
            styles.targetHeaderRow
          }
        >
          <View>
            <Text
              style={
                styles.targetLabel
              }
            >
              TARGET TITIK BERIKUTNYA
            </Text>

            <Text
              style={styles.targetName}
            >
              {currentPoint.name}
            </Text>
          </View>

          <View
            style={
              styles.targetCodeBadge
            }
          >
            <Text
              style={
                styles.targetCodeText
              }
            >
              {currentPoint.code}
            </Text>
          </View>
        </View>

        <Text
          style={styles.targetSubText}
        >
          {currentPoint.subText}
        </Text>

        <TouchableOpacity
          style={
            styles.rotateActionBtn
          }
          onPress={
            handleNextRotation
          }
        >
          <RotateCw
            size={16}
            color="#022c22"
          />

          <Text
            style={
              styles.rotateActionBtnText
            }
          >
            Putar ke Titik
            Selanjutnya
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pemilih Tab */}
      <View
        style={
          styles.zoneSelectorContainer
        }
      >
        {(
          [
            'perut',
            'paha',
            'lengan',
            'bokong',
          ] as BodyZone[]
        ).map((zone) => (
          <TouchableOpacity
            key={zone}
            onPress={() =>
              setSelectedZone(zone)
            }
            style={[
              styles.zoneTab,
              selectedZone ===
                zone &&
                styles.zoneTabActive,
            ]}
          >
            <Text
              style={[
                styles.zoneTabText,
                selectedZone ===
                  zone &&
                  styles.zoneTabTextActive,
              ]}
            >
              {zone.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Diagram Anatomi */}
      <View
        style={styles.visualMapCard}
      >
        <Text
          style={
            styles.mapHeaderTitle
          }
        >
          DIAGRAM ANATOMI (
          {selectedZone.toUpperCase()}
          )
        </Text>

        <View
          style={styles.svgContainer}
        >
          <Svg
            height="230"
            width="100%"
            viewBox="0 0 300 220"
          >
            {/* =====================================================
                PERUT
                ===================================================== */}
            {selectedZone ===
              'perut' && (
              <G>
                {/* Leher */}
                <Path
                  d="
                    M137 30
                    L137 17
                    Q150 10 163 17
                    L163 30
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Torso */}
                <Path
                  d="
                    M119 29
                    Q150 16 181 29
                    Q192 39 196 61
                    Q200 83 200 109
                    Q199 139 190 169
                    Q176 181 150 182
                    Q124 181 110 169
                    Q101 139 100 109
                    Q100 83 104 61
                    Q108 39 119 29
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Bahu kiri */}
                <Path
                  d="
                    M116 34
                    Q102 36 94 48
                    L84 78
                  "
                  fill="none"
                  stroke="#334155"
                  strokeWidth="7"
                  strokeLinecap="round"
                />

                {/* Bahu kanan */}
                <Path
                  d="
                    M184 34
                    Q198 36 206 48
                    L216 78
                  "
                  fill="none"
                  stroke="#334155"
                  strokeWidth="7"
                  strokeLinecap="round"
                />

                {/* Garis tengah abdomen */}
                <Line
                  x1="150"
                  y1="50"
                  x2="150"
                  y2="160"
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                {/* Pusar */}
                <Circle
                  cx="150"
                  cy="105"
                  r="8"
                  fill="#030712"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />

                <SvgText
                  x="150"
                  y="108"
                  fill="#38bdf8"
                  fontSize="7"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  PUSAR
                </SvgText>

                {/* KA */}
                <G
                  onPress={() =>
                    setSite('KA')
                  }
                >
                  <Circle
                    cx="125"
                    cy="76"
                    r="20"
                    fill={siteFill(
                      'KA',
                    )}
                    stroke={siteStroke(
                      'KA',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'KA',
                    )}
                  />

                  <SvgText
                    x="125"
                    y="80"
                    fill={siteText(
                      'KA',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    KA
                  </SvgText>
                </G>

                {/* KiA */}
                <G
                  onPress={() =>
                    setSite('KiA')
                  }
                >
                  <Circle
                    cx="175"
                    cy="76"
                    r="20"
                    fill={siteFill(
                      'KiA',
                    )}
                    stroke={siteStroke(
                      'KiA',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'KiA',
                    )}
                  />

                  <SvgText
                    x="175"
                    y="80"
                    fill={siteText(
                      'KiA',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    KiA
                  </SvgText>
                </G>

                {/* KB */}
                <G
                  onPress={() =>
                    setSite('KB')
                  }
                >
                  <Circle
                    cx="125"
                    cy="136"
                    r="20"
                    fill={siteFill(
                      'KB',
                    )}
                    stroke={siteStroke(
                      'KB',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'KB',
                    )}
                  />

                  <SvgText
                    x="125"
                    y="140"
                    fill={siteText(
                      'KB',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    KB
                  </SvgText>
                </G>

                {/* KiB */}
                <G
                  onPress={() =>
                    setSite('KiB')
                  }
                >
                  <Circle
                    cx="175"
                    cy="136"
                    r="20"
                    fill={siteFill(
                      'KiB',
                    )}
                    stroke={siteStroke(
                      'KiB',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'KiB',
                    )}
                  />

                  <SvgText
                    x="175"
                    y="140"
                    fill={siteText(
                      'KiB',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    KiB
                  </SvgText>
                </G>

                <SvgText
                  x="150"
                  y="204"
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="middle"
                >
                  DEPAN · ABDOMEN
                </SvgText>
              </G>
            )}

            {/* =====================================================
                PAHA
                ===================================================== */}
            {selectedZone ===
              'paha' && (
              <G>
                {/* Pelvis */}
                <Path
                  d="
                    M116 25
                    Q150 10 184 25
                    Q192 40 186 59
                    Q150 72 114 59
                    Q108 40 116 25
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Kaki kiri */}
                <Path
                  d="
                    M122 54
                    Q105 58 101 78
                    Q98 101 96 125
                    L91 173
                    Q90 192 105 198
                    Q121 201 129 184
                    L143 91
                    Q146 68 122 54
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Kaki kanan */}
                <Path
                  d="
                    M178 54
                    Q195 58 199 78
                    Q202 101 204 125
                    L209 173
                    Q210 192 195 198
                    Q179 201 171 184
                    L157 91
                    Q154 68 178 54
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Titik PKi */}
                <G
                  onPress={() =>
                    setSite('PKi')
                  }
                >
                  <Circle
                    cx="116"
                    cy="105"
                    r="21"
                    fill={siteFill(
                      'PKi',
                    )}
                    stroke={siteStroke(
                      'PKi',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'PKi',
                    )}
                  />

                  <SvgText
                    x="116"
                    y="109"
                    fill={siteText(
                      'PKi',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    PKi
                  </SvgText>
                </G>

                {/* Titik PKn */}
                <G
                  onPress={() =>
                    setSite('PKn')
                  }
                >
                  <Circle
                    cx="184"
                    cy="105"
                    r="21"
                    fill={siteFill(
                      'PKn',
                    )}
                    stroke={siteStroke(
                      'PKn',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'PKn',
                    )}
                  />

                  <SvgText
                    x="184"
                    y="109"
                    fill={siteText(
                      'PKn',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    PKn
                  </SvgText>
                </G>

                <SvgText
                  x="150"
                  y="214"
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="middle"
                >
                  DEPAN · PAHA
                </SvgText>
              </G>
            )}

            {/* =====================================================
                LENGAN
                ===================================================== */}
            {selectedZone ===
              'lengan' && (
              <G>
                {/* Bahu dan torso orientasi */}
                <Path
                  d="
                    M126 36
                    Q150 25 174 36
                    L181 120
                    Q177 146 150 151
                    Q123 146 119 120
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Lengan kiri */}
                <Path
                  d="
                    M121 39
                    Q102 38 91 51
                    Q82 63 81 80
                    L83 148
                    Q84 169 99 173
                    Q113 175 119 158
                    L116 96
                    Q116 72 130 58
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Lengan kanan */}
                <Path
                  d="
                    M179 39
                    Q198 38 209 51
                    Q218 63 219 80
                    L217 148
                    Q216 169 201 173
                    Q187 175 181 158
                    L184 96
                    Q184 72 170 58
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* LKi */}
                <G
                  onPress={() =>
                    setSite('LKi')
                  }
                >
                  <Circle
                    cx="100"
                    cy="103"
                    r="21"
                    fill={siteFill(
                      'LKi',
                    )}
                    stroke={siteStroke(
                      'LKi',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'LKi',
                    )}
                  />

                  <SvgText
                    x="100"
                    y="107"
                    fill={siteText(
                      'LKi',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    LKi
                  </SvgText>
                </G>

                {/* LKn */}
                <G
                  onPress={() =>
                    setSite('LKn')
                  }
                >
                  <Circle
                    cx="200"
                    cy="103"
                    r="21"
                    fill={siteFill(
                      'LKn',
                    )}
                    stroke={siteStroke(
                      'LKn',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'LKn',
                    )}
                  />

                  <SvgText
                    x="200"
                    y="107"
                    fill={siteText(
                      'LKn',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    LKn
                  </SvgText>
                </G>

                <SvgText
                  x="150"
                  y="202"
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="middle"
                >
                  SISI · LENGAN ATAS
                </SvgText>
              </G>
            )}

            {/* =====================================================
                BOKONG
                ===================================================== */}
            {selectedZone ===
              'bokong' && (
              <G>
                {/* Lower back / pelvis */}
                <Path
                  d="
                    M114 26
                    Q150 10 186 26
                    Q194 44 188 67
                    Q150 83 112 67
                    Q106 44 114 26
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Bokong kiri */}
                <Path
                  d="
                    M113 55
                    Q94 59 90 81
                    Q87 107 95 139
                    Q100 165 119 171
                    Q137 171 145 151
                    L145 91
                    Q141 64 113 55
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Bokong kanan */}
                <Path
                  d="
                    M187 55
                    Q206 59 210 81
                    Q213 107 205 139
                    Q200 165 181 171
                    Q163 171 155 151
                    L155 91
                    Q159 64 187 55
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* BKi */}
                <G
                  onPress={() =>
                    setSite('BKi')
                  }
                >
                  <Circle
                    cx="117"
                    cy="112"
                    r="21"
                    fill={siteFill(
                      'BKi',
                    )}
                    stroke={siteStroke(
                      'BKi',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'BKi',
                    )}
                  />

                  <SvgText
                    x="117"
                    y="116"
                    fill={siteText(
                      'BKi',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    BKi
                  </SvgText>
                </G>

                {/* BKn */}
                <G
                  onPress={() =>
                    setSite('BKn')
                  }
                >
                  <Circle
                    cx="183"
                    cy="112"
                    r="21"
                    fill={siteFill(
                      'BKn',
                    )}
                    stroke={siteStroke(
                      'BKn',
                    )}
                    strokeWidth={siteStrokeWidth(
                      'BKn',
                    )}
                  />

                  <SvgText
                    x="183"
                    y="116"
                    fill={siteText(
                      'BKn',
                    )}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    BKn
                  </SvgText>
                </G>

                {/* Garis tengah punggung */}
                <Line
                  x1="150"
                  y1="70"
                  x2="150"
                  y2="158"
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                <SvgText
                  x="150"
                  y="198"
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="middle"
                >
                  BELAKANG · GLUTE
                </SvgText>
              </G>
            )}
          </Svg>
        </View>
      </View>

      {/* Grid Pilihan Titik Manual */}
      <Text
        style={
          styles.sectionHeaderTitle
        }
      >
        PILIH TITIK MANUAL (
        {selectedZone.toUpperCase()}
        )
      </Text>

      <View
        style={styles.manualGrid}
      >
        {activeZoneSites.map(
          (item) => {
            const isSelected =
              currentSite ===
              item.id;

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  setSite(
                    item.id,
                  )
                }
                style={[
                  styles.manualSiteCard,
                  isSelected &&
                    styles.manualSiteCardActive,
                ]}
              >
                <View
                  style={
                    styles.siteCardTop
                  }
                >
                  <Text
                    style={[
                      styles.siteCardCode,
                      isSelected &&
                        styles.siteCardCodeActive,
                    ]}
                  >
                    {item.code}
                  </Text>

                  {isSelected ? (
                    <CheckCircle2
                      size={16}
                      color="#10b981"
                    />
                  ) : (
                    <Clock
                      size={14}
                      color="#64748b"
                    />
                  )}
                </View>

                <Text
                  style={
                    styles.siteCardName
                  }
                >
                  {item.name}
                </Text>

                <Text
                  style={
                    styles.siteCardSub
                  }
                >
                  {getSiteLastUsed(
                    item.id,
                  )}
                </Text>
              </TouchableOpacity>
            );
          },
        )}
      </View>

      <View
        style={styles.safetyCard}
      >
        <ShieldCheck
          size={16}
          color="#10b981"
        />

        <Text
          style={styles.safetyText}
        >
          Jarak penyuntikan minimal
          2.5 cm dari bekas tusukan
          sebelumnya untuk menjaga
          elastisitas jaringan lemak
          subkutan.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 104,
    gap: 12,
  },

  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },

  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor:
      'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  bannerDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  activeTargetCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor:
      'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },

  targetHeaderRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  targetLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },

  targetName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },

  targetCodeBadge: {
    backgroundColor:
      'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  targetCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
  },

  targetSubText: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 8,
  },

  rotateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
  },

  rotateActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#022c22',
  },

  zoneSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },

  zoneTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },

  zoneTabActive: {
    backgroundColor:
      'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
  },

  zoneTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },

  zoneTabTextActive: {
    color: '#10b981',
  },

  visualMapCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },

  mapHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },

  svgContainer: {
    backgroundColor: '#030712',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  manualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  manualSiteCard: {
    width: '48.5%',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },

  manualSiteCardActive: {
    borderColor: '#10b981',
    backgroundColor:
      'rgba(16, 185, 129, 0.05)',
  },

  siteCardTop: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  siteCardCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },

  siteCardCodeActive: {
    color: '#10b981',
  },

  siteCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  siteCardSub: {
    fontSize: 9,
    color: '#64748b',
  },

  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor:
      'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor:
      'rgba(16, 185, 129, 0.2)',
    padding: 12,
    borderRadius: 12,
  },

  safetyText: {
    flex: 1,
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
  },
});
