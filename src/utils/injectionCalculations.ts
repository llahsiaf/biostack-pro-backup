import type { InventoryItem } from '../store/useBioStackStore';

export interface InjectionMetrics {
  dose: number;
  doseUnit: InventoryItem['doseUnit'];
  concentration: number;
  concentrationUnit: InventoryItem['unit'];
  volumeMl: string;
  volumeMlNumber: number;
  iu: number;
  dialClicks: number;
  valid: boolean;
}

const round = (value: number, digits = 3) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/**
 * Calculates tracker-only volume/marking metrics from values already stored by the user.
 * It does not recommend or select a dose.
 */
export function calculateInjectionMetrics(
  item: InventoryItem,
  overrideDose?: string,
  overrideBac?: string,
): InjectionMetrics {
  const dose = overrideDose !== undefined
    ? Number.parseFloat(overrideDose) || 0
    : Number(item.targetDose) || 0;
  const bac = overrideBac !== undefined
    ? Number.parseFloat(overrideBac) || 0
    : Number(item.bacWater) || 0;

  if (dose <= 0) {
    return {
      dose,
      doseUnit: item.doseUnit,
      concentration: 0,
      concentrationUnit: item.unit,
      volumeMl: '0.000',
      volumeMlNumber: 0,
      iu: 0,
      dialClicks: 0,
      valid: false,
    };
  }

  if (item.unit === 'mL') {
    const valid = item.doseUnit === 'mL';
    const volume = valid ? dose : 0;
    const iu = Math.round(volume * 100);
    return {
      dose,
      doseUnit: item.doseUnit,
      concentration: valid ? 1 : 0,
      concentrationUnit: 'mL',
      volumeMl: volume.toFixed(3),
      volumeMlNumber: volume,
      iu,
      dialClicks: iu,
      valid,
    };
  }

  if ((item.unit !== 'mg' && item.unit !== 'mcg') || (item.doseUnit !== 'mg' && item.doseUnit !== 'mcg')) {
    return {
      dose,
      doseUnit: item.doseUnit,
      concentration: 0,
      concentrationUnit: item.unit,
      volumeMl: '0.000',
      volumeMlNumber: 0,
      iu: 0,
      dialClicks: 0,
      valid: false,
    };
  }

  if (bac <= 0 || item.vialSize <= 0) {
    return {
      dose,
      doseUnit: item.doseUnit,
      concentration: 0,
      concentrationUnit: item.unit,
      volumeMl: '0.000',
      volumeMlNumber: 0,
      iu: 0,
      dialClicks: 0,
      valid: false,
    };
  }

  const vialAmountInMg = item.unit === 'mg' ? item.vialSize : item.vialSize / 1000;
  const doseInMg = item.doseUnit === 'mg' ? dose : dose / 1000;
  const concentrationMgPerMl = vialAmountInMg / bac;
  const volume = doseInMg / concentrationMgPerMl;
  const iu = Math.round(volume * 100);

  return {
    dose,
    doseUnit: item.doseUnit,
    concentration: round(concentrationMgPerMl, 6),
    concentrationUnit: item.unit,
    volumeMl: volume.toFixed(3),
    volumeMlNumber: volume,
    iu,
    dialClicks: iu,
    valid: Number.isFinite(volume) && volume >= 0,
  };
}

export function getLiquidStatus(item: InventoryItem) {
  const initialVolume = item.initialVolumeMl !== undefined
    ? Math.max(0, Number(item.initialVolumeMl) || 0)
    : item.unit === 'mL'
      ? Math.max(0, item.vialSize)
      : Math.max(0, item.bacWater || 0);
  const currentVolume = Math.max(
    0,
    Math.min(
      initialVolume,
      item.currentVolumeMl !== undefined ? item.currentVolumeMl : initialVolume,
    ),
  );
  const progressPercent = initialVolume > 0
    ? Math.max(0, Math.min(100, (currentVolume / initialVolume) * 100))
    : 0;

  const metrics = calculateInjectionMetrics(item);
  const dosesLeft = metrics.volumeMlNumber > 0
    ? Math.floor(currentVolume / metrics.volumeMlNumber)
    : 0;

  let daysMultiplier = 7;
  if (item.frequency === 'daily') daysMultiplier = 1;
  else if (item.frequency === '2x_week') daysMultiplier = 3.5;
  else if (item.frequency === '3x_week') daysMultiplier = 2.33;

  return {
    currentVol: currentVolume,
    initialVol: initialVolume,
    progressPercent,
    dosesLeft,
    daysLeft: Math.max(0, Math.round(dosesLeft * daysMultiplier)),
  };
}
