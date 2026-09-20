import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
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

const ALL_SITES_EN: SitePoint[] = [
  {
    id: 'KA',
    code: 'RU',
    name: 'Right Upper (RU)',
    subText: 'Right upper abdomen (2-3 cm from navel)',
    zone: 'perut',
  },
  {
    id: 'KiA',
    code: 'LU',
    name: 'Left Upper (LU)',
    subText: 'Left upper abdomen (2-3 cm from navel)',
    zone: 'perut',
  },
  {
    id: 'KB',
    code: 'RL',
    name: 'Right Lower (RL)',
    subText: 'Right lower abdomen (2-3 cm from navel)',
    zone: 'perut',
  },
  {
    id: 'KiB',
    code: 'LL',
    name: 'Left Lower (LL)',
    subText: 'Left lower abdomen (2-3 cm from navel)',
    zone: 'perut',
  },
  {
    id: 'PKi',
    code: 'LT',
    name: 'Left Thigh (LT)',
    subText: 'Outer side of upper left thigh',
    zone: 'paha',
  },
  {
    id: 'PKn',
    code: 'RT',
    name: 'Right Thigh (RT)',
    subText: 'Outer side of upper right thigh',
    zone: 'paha',
  },
  {
    id: 'LKi',
    code: 'LA',
    name: 'Left Arm (LA)',
    subText: 'Triceps / back of left upper arm',
    zone: 'lengan',
  },
  {
    id: 'LKn',
    code: 'RA',
    name: 'Right Arm (RA)',
    subText: 'Triceps / back of right upper arm',
    zone: 'lengan',
  },
  {
    id: 'BKi',
    code: 'LG',
    name: 'Left Glute (LG)',
    subText: 'Upper outer quadrant of left glute',
    zone: 'bokong',
  },
  {
    id: 'BKn',
    code: 'RG',
    name: 'Right Glute (RG)',
    subText: 'Upper outer quadrant of right glute',
    zone: 'bokong',
  },
];

export const SITE_CODE_EN: Record<string, string> = {
  KA: 'RU',
  KiA: 'LU',
  KB: 'RL',
  KiB: 'LL',
  PKi: 'LT',
  PKn: 'RT',
  LKi: 'LA',
  LKn: 'RA',
  BKi: 'LG',
  BKn: 'RG',
};

export const getSiteDisplayCode = (siteId: string, language: 'id' | 'en') => {
  if (language === 'en') {
    return SITE_CODE_EN[siteId] || siteId;
  }
  return siteId;
};

export const RotationScreen: React.FC = () => {
  const { language, t } = useLanguage();
  const {
    currentSite,
    setSite,
    rotateToNextSite,
    injectionHistory,
  } = useBioStackStore();

  const [selectedZone, setSelectedZone] =
    useState<BodyZone>('perut');

  const sitesList = language === 'en' ? ALL_SITES_EN : ALL_SITES;

  const currentPoint =
    sitesList.find(
      (s) => s.id === currentSite,
    ) || sitesList[0];

  const activeZoneSites =
    sitesList.filter(
      (s) => s.zone === selectedZone,
    );

  const getZoneLabel = (zone: BodyZone) => {
    if (language === 'en') {
      switch (zone) {
        case 'perut':
          return 'ABDOMEN';
        case 'paha':
          return 'THIGH';
        case 'lengan':
          return 'ARM';
        case 'bokong':
          return 'GLUTE';
      }
    }
    return zone.toUpperCase();
  };

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
      const trans = t('rotation.noLog');
      if (trans && trans !== 'rotation.noLog') {
        return trans;
      }
      return language === 'en' ? 'Never injected' : 'Belum pernah disuntik';
    }

    return log.timestamp || (language === 'en' ? 'Just now' : 'Baru saja');
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
            {language === 'en'
              ? 'Anatomical Rotation Protocol'
              : 'Protokol Rotasi Anatomi'}
          </Text>

          <Text
            style={styles.bannerDesc}
          >
            {language === 'en'
              ? 'Prevents lipohypertrophy and subcutaneous scar tissue buildup.'
              : 'Mencegah lipohipertrofi dan penumpukan jaringan parut subkutan.'}
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
              {language === 'en'
                ? 'NEXT TARGET SITE'
                : 'TARGET TITIK BERIKUTNYA'}
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
            {language === 'en'
              ? 'Rotate to Next Site'
              : 'Putar ke Titik Selanjutnya'}
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
              {getZoneLabel(zone)}
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
          {language === 'en' ? 'ANATOMY DIAGRAM' : 'DIAGRAM ANATOMI'} (
          {getZoneLabel(selectedZone)}
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
            {selectedZone === 'perut' && (
              <G>
                {/* Leher & Clavicle */}
                <Path
                  d="M138 28 L138 18 Q150 14 162 18 L162 28"
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="1.5"
                />

                {/* Torso Kontur Alami Tubuh Manusia */}
                <Path
                  d="
                    M138 28
                    Q115 30 96 44
                    Q92 56 94 72
                    Q98 94 102 110
                    Q100 134 94 154
                    Q98 174 122 178
                    Q136 180 150 174
                    Q164 180 178 178
                    Q202 174 206 154
                    Q200 134 198 110
                    Q202 94 206 72
                    Q208 56 204 44
                    Q185 30 162 28
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Garis Klavikula / Tulang Selangka */}
                <Path
                  d="M102 46 Q130 42 142 46 M158 46 Q170 42 198 46"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Arkus Tulang Rusuk (Subcostal Arch) */}
                <Path
                  d="M112 80 Q132 60 150 62 Q168 60 188 80"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Garis Lipatan Inguinal / Pinggul */}
                <Path
                  d="M102 154 Q124 172 146 172 M198 154 Q176 172 154 172"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  fill="none"
                />

                {/* Garis Tengah (Linea Alba) */}
                <Line
                  x1="150"
                  y1="46"
                  x2="150"
                  y2="170"
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Garis Horizontal Transumbilikal */}
                <Line
                  x1="104"
                  y1="106"
                  x2="196"
                  y2="106"
                  stroke="#162035"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Zona Aman Pusar (Buffer Ring) */}
                <Circle
                  cx="150"
                  cy="106"
                  r="22"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity={0.35}
                />

                {/* Pusar */}
                <Circle
                  cx="150"
                  cy="106"
                  r="6"
                  fill="#030712"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
                <Circle
                  cx="150"
                  cy="106"
                  r="2"
                  fill="#38bdf8"
                />

                <SvgText
                  x="150"
                  y="95"
                  fill="#38bdf8"
                  fontSize="7"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'NAVEL' : 'PUSAR'}
                </SvgText>

                {/* KA */}
                <G onPress={() => setSite('KA')}>
                  <Circle
                    cx="125"
                    cy="76"
                    r="20"
                    fill={siteFill('KA')}
                    stroke={siteStroke('KA')}
                    strokeWidth={siteStrokeWidth('KA')}
                  />
                  <SvgText
                    x="125"
                    y="80"
                    fill={siteText('KA')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('KA', language)}
                  </SvgText>
                </G>

                {/* KiA */}
                <G onPress={() => setSite('KiA')}>
                  <Circle
                    cx="175"
                    cy="76"
                    r="20"
                    fill={siteFill('KiA')}
                    stroke={siteStroke('KiA')}
                    strokeWidth={siteStrokeWidth('KiA')}
                  />
                  <SvgText
                    x="175"
                    y="80"
                    fill={siteText('KiA')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('KiA', language)}
                  </SvgText>
                </G>

                {/* KB */}
                <G onPress={() => setSite('KB')}>
                  <Circle
                    cx="125"
                    cy="136"
                    r="20"
                    fill={siteFill('KB')}
                    stroke={siteStroke('KB')}
                    strokeWidth={siteStrokeWidth('KB')}
                  />
                  <SvgText
                    x="125"
                    y="140"
                    fill={siteText('KB')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('KB', language)}
                  </SvgText>
                </G>

                {/* KiB */}
                <G onPress={() => setSite('KiB')}>
                  <Circle
                    cx="175"
                    cy="136"
                    r="20"
                    fill={siteFill('KiB')}
                    stroke={siteStroke('KiB')}
                    strokeWidth={siteStrokeWidth('KiB')}
                  />
                  <SvgText
                    x="175"
                    y="140"
                    fill={siteText('KiB')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('KiB', language)}
                  </SvgText>
                </G>

                <SvgText
                  x="150"
                  y="204"
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'ANTERIOR · ABDOMEN' : 'DEPAN · ABDOMEN'}
                </SvgText>
              </G>
            )}

            {/* =====================================================
                PAHA
                ===================================================== */}
            {selectedZone === 'paha' && (
              <G>
                {/* Pelvis & Panggul */}
                <Path
                  d="
                    M98 24
                    Q150 14 202 24
                    Q210 42 208 58
                    Q150 68 92 58
                    Q90 42 98 24
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Kaki kiri (Anterior) */}
                <Path
                  d="
                    M96 56
                    Q86 78 88 112
                    Q90 148 96 176
                    Q100 196 112 198
                    Q124 198 128 178
                    Q134 148 138 108
                    Q142 76 138 60
                    Q116 66 96 56
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Kaki kanan (Anterior) */}
                <Path
                  d="
                    M204 56
                    Q214 78 212 112
                    Q210 148 204 176
                    Q200 196 188 198
                    Q176 198 172 178
                    Q166 148 162 108
                    Q158 76 162 60
                    Q184 66 204 56
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Garis Otot Kuadrisep / Vastus Lateralis */}
                <Path
                  d="M106 72 Q102 114 108 162"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  fill="none"
                />
                <Path
                  d="M194 72 Q198 114 192 162"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  fill="none"
                />

                {/* Indikator Patella / Lutut */}
                <Path
                  d="M106 182 Q112 186 118 182"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M182 182 Q188 186 194 182"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Titik PKi */}
                <G onPress={() => setSite('PKi')}>
                  <Circle
                    cx="116"
                    cy="105"
                    r="21"
                    fill={siteFill('PKi')}
                    stroke={siteStroke('PKi')}
                    strokeWidth={siteStrokeWidth('PKi')}
                  />
                  <SvgText
                    x="116"
                    y="109"
                    fill={siteText('PKi')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('PKi', language)}
                  </SvgText>
                </G>

                {/* Titik PKn */}
                <G onPress={() => setSite('PKn')}>
                  <Circle
                    cx="184"
                    cy="105"
                    r="21"
                    fill={siteFill('PKn')}
                    stroke={siteStroke('PKn')}
                    strokeWidth={siteStrokeWidth('PKn')}
                  />
                  <SvgText
                    x="184"
                    y="109"
                    fill={siteText('PKn')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('PKn', language)}
                  </SvgText>
                </G>

                <SvgText
                  x="150"
                  y="214"
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'ANTERIOR · THIGH' : 'DEPAN · PAHA'}
                </SvgText>
              </G>
            )}

            {/* =====================================================
                LENGAN
                ===================================================== */}
            {selectedZone === 'lengan' && (
              <G>
                {/* Torso & Punggung / Bahu */}
                <Path
                  d="
                    M136 28
                    Q150 18 164 28
                    L174 38
                    Q178 78 174 130
                    Q168 152 150 154
                    Q132 152 126 130
                    Q122 78 126 38
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Lengan kiri (Anatomi Deltoid & Trisep) */}
                <Path
                  d="
                    M126 38
                    Q102 36 88 52
                    Q78 68 78 94
                    Q80 126 84 156
                    Q88 178 100 178
                    Q110 178 114 158
                    Q116 128 116 92
                    Q118 68 126 48
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Lengan kanan (Anatomi Deltoid & Trisep) */}
                <Path
                  d="
                    M174 38
                    Q198 36 212 52
                    Q222 68 222 94
                    Q220 126 216 156
                    Q212 178 200 178
                    Q190 178 186 158
                    Q184 128 184 92
                    Q182 68 174 48
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Batas Otot Deltoid / Zona Injeksi Subkutan */}
                <Path
                  d="M82 72 Q98 84 116 76"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  fill="none"
                />
                <Path
                  d="M218 72 Q202 84 184 76"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  fill="none"
                />

                {/* Lipatan Siku / Olecranon */}
                <Path
                  d="M86 158 Q98 162 112 158"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M188 158 Q202 162 214 158"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Garis Tengah Tulang Belakang */}
                <Line
                  x1="150"
                  y1="34"
                  x2="150"
                  y2="140"
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* LKi */}
                <G onPress={() => setSite('LKi')}>
                  <Circle
                    cx="100"
                    cy="103"
                    r="21"
                    fill={siteFill('LKi')}
                    stroke={siteStroke('LKi')}
                    strokeWidth={siteStrokeWidth('LKi')}
                  />
                  <SvgText
                    x="100"
                    y="107"
                    fill={siteText('LKi')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('LKi', language)}
                  </SvgText>
                </G>

                {/* LKn */}
                <G onPress={() => setSite('LKn')}>
                  <Circle
                    cx="200"
                    cy="103"
                    r="21"
                    fill={siteFill('LKn')}
                    stroke={siteStroke('LKn')}
                    strokeWidth={siteStrokeWidth('LKn')}
                  />
                  <SvgText
                    x="200"
                    y="107"
                    fill={siteText('LKn')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('LKn', language)}
                  </SvgText>
                </G>

                <SvgText
                  x="150"
                  y="202"
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'LATERAL · UPPER ARM' : 'SISI · LENGAN ATAS'}
                </SvgText>
              </G>
            )}

            {/* =====================================================
                BOKONG
                ===================================================== */}
            {selectedZone === 'bokong' && (
              <G>
                {/* Pinggang Bawah / Pelvis Posterior */}
                <Path
                  d="
                    M112 24
                    Q150 12 188 24
                    Q196 42 192 62
                    Q150 74 108 62
                    Q104 42 112 24
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Bokong kiri (Anatomi Gluteus) */}
                <Path
                  d="
                    M110 54
                    Q90 58 84 82
                    Q78 114 86 142
                    Q94 168 116 172
                    Q136 172 146 154
                    L146 88
                    Q140 62 110 54
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Bokong kanan (Anatomi Gluteus) */}
                <Path
                  d="
                    M190 54
                    Q210 58 216 82
                    Q222 114 214 142
                    Q206 168 184 172
                    Q164 172 154 154
                    L154 88
                    Q160 62 190 54
                    Z
                  "
                  fill="#090d16"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Garis Tengah Lipatan Bokong (Intergluteal Cleft) */}
                <Line
                  x1="150"
                  y1="56"
                  x2="150"
                  y2="164"
                  stroke="#1e293b"
                  strokeWidth="2"
                />

                {/* Lipatan Gluteal Bawah (Infragluteal Fold) */}
                <Path
                  d="M96 164 Q118 174 144 164"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M156 164 Q182 174 204 164"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Kuadran Kuadran Bantuan Medis (Safe Upper Outer Quadrant) */}
                <Line
                  x1="117"
                  y1="76"
                  x2="117"
                  y2="152"
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <Line
                  x1="90"
                  y1="112"
                  x2="144"
                  y2="112"
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />

                <Line
                  x1="183"
                  y1="76"
                  x2="183"
                  y2="152"
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <Line
                  x1="156"
                  y1="112"
                  x2="210"
                  y2="112"
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />

                {/* BKi */}
                <G onPress={() => setSite('BKi')}>
                  <Circle
                    cx="117"
                    cy="112"
                    r="21"
                    fill={siteFill('BKi')}
                    stroke={siteStroke('BKi')}
                    strokeWidth={siteStrokeWidth('BKi')}
                  />
                  <SvgText
                    x="117"
                    y="116"
                    fill={siteText('BKi')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('BKi', language)}
                  </SvgText>
                </G>

                {/* BKn */}
                <G onPress={() => setSite('BKn')}>
                  <Circle
                    cx="183"
                    cy="112"
                    r="21"
                    fill={siteFill('BKn')}
                    stroke={siteStroke('BKn')}
                    strokeWidth={siteStrokeWidth('BKn')}
                  />
                  <SvgText
                    x="183"
                    y="116"
                    fill={siteText('BKn')}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {getSiteDisplayCode('BKn', language)}
                  </SvgText>
                </G>

                <SvgText
                  x="150"
                  y="198"
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="middle"
                >
                  {language === 'en' ? 'POSTERIOR · GLUTE' : 'BELAKANG · BOKONG'}
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
        {language === 'en' ? 'MANUAL SITE SELECTION' : 'PILIH TITIK MANUAL'} (
        {getZoneLabel(selectedZone)}
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
          {language === 'en'
            ? 'Maintain at least 2.5 cm distance from previous injection sites to preserve subcutaneous tissue elasticity.'
            : 'Jarak penyuntikan minimal 2.5 cm dari bekas tusukan sebelumnya untuk menjaga elastisitas jaringan lemak subkutan.'}
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
