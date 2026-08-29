import type { InjectionLog } from '../types';

export const ROTATION_SITE_ORDER = [
  'KA', 'KiA', 'KB', 'KiB', 'PKi', 'PKn', 'LKi', 'LKn', 'BKi', 'BKn',
] as const;

export function getSiteLabel(siteId: string) {
  const labels: Record<string, string> = {
    KA: 'Perut kanan atas',
    KiA: 'Perut kiri atas',
    KB: 'Perut kanan bawah',
    KiB: 'Perut kiri bawah',
    PKi: 'Paha kiri luar',
    PKn: 'Paha kanan luar',
    LKi: 'Lengan kiri',
    LKn: 'Lengan kanan',
    BKi: 'Bokong kiri',
    BKn: 'Bokong kanan',
  };
  return labels[siteId] || siteId;
}

/**
 * Tracker helper only: chooses the site that has been used least recently
 * for the selected vial. It does not provide medical guidance.
 */
export function getTrackerSuggestedSite(
  injectionHistory: InjectionLog[],
  inventoryId: string,
) {
  const logs = (injectionHistory || [])
    .filter((log) => log.inventoryId === inventoryId && ROTATION_SITE_ORDER.includes(log.siteId as any))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

  const lastUsed = new Map<string, number>();
  logs.forEach((log, index) => {
    if (!lastUsed.has(log.siteId)) lastUsed.set(log.siteId, index);
  });

  return [...ROTATION_SITE_ORDER]
    .sort((a, b) => (lastUsed.get(b) ?? Number.POSITIVE_INFINITY) - (lastUsed.get(a) ?? Number.POSITIVE_INFINITY))[0];
}
