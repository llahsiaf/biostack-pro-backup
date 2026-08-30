import type { InjectionLog, InventoryItem } from '../types';
import { calculateInjectionMetrics } from './injectionCalculations';

export const WEEKDAY_LABELS = [
  'Min',
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
] as const;

export type WeekdayLabel =
  typeof WEEKDAY_LABELS[number];

export type OccurrenceStatus =
  | 'completed'
  | 'missed'
  | 'due'
  | 'upcoming'
  | 'inactive';

export interface ScheduledOccurrence {
  inventoryId: string;
  peptideName: string;
  date: string;
  time: string;
  completed: boolean;
  missed: boolean;
  status: OccurrenceStatus;
}

export const formatLocalDate = (
  date: Date,
): string => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');
  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const weekdayLabelForDate = (
  date: Date,
): WeekdayLabel => {
  return WEEKDAY_LABELS[date.getDay()];
};

const parseDateKey = (
  value?: string,
): Date | null => {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = value.split('-').map(Number);

  const parsed = new Date(
    year,
    month - 1,
    day,
  );

  return Number.isNaN(
    parsed.getTime(),
  )
    ? null
    : parsed;
};

/**
 * Menentukan apakah jadwal peptide aktif
 * pada tanggal tertentu.
 */
export const isInventoryScheduleActiveOnDate = (
  item: Pick<
    InventoryItem,
    | 'activeDays'
    | 'scheduleStartDate'
    | 'scheduleEndDate'
    | 'schedulePaused'
    | 'lifecycleStatus'
  >,
  date: Date,
): boolean => {
  if (
    item.schedulePaused ||
    item.lifecycleStatus === 'archived' ||
    item.lifecycleStatus === 'empty'
  ) {
    return false;
  }

  const dateKey =
    formatLocalDate(date);

  if (
    item.scheduleStartDate &&
    dateKey < item.scheduleStartDate
  ) {
    return false;
  }

  if (
    item.scheduleEndDate &&
    dateKey > item.scheduleEndDate
  ) {
    return false;
  }

  const days =
    Array.isArray(item.activeDays)
      ? item.activeDays
      : [];

  return days.includes(
    weekdayLabelForDate(date),
  );
};

/**
 * Alias lama agar kompatibel dengan
 * kode phase sebelumnya.
 */
export const isInventoryScheduledOnDate = (
  item: Pick<
    InventoryItem,
    | 'activeDays'
    | 'scheduleStartDate'
    | 'scheduleEndDate'
    | 'schedulePaused'
    | 'lifecycleStatus'
  >,
  date: Date,
): boolean => {
  return isInventoryScheduleActiveOnDate(
    item,
    date,
  );
};

/**
 * Mengecek apakah peptide sudah dicatat
 * pada tanggal tertentu.
 */
export const hasCompletedOccurrence = (
  item: Pick<InventoryItem, 'id'>,
  date: Date,
  logs: InjectionLog[],
): boolean => {
  const dateKey =
    formatLocalDate(date);

  return logs.some((log) => {
    if (
      log.inventoryId !== item.id
    ) {
      return false;
    }

    const timestamp =
      new Date(log.timestamp);

    if (
      Number.isNaN(
        timestamp.getTime(),
      )
    ) {
      return false;
    }

    return (
      formatLocalDate(timestamp) ===
      dateKey
    );
  });
};

/**
 * Mengubah HH:mm menjadi total menit.
 */
const scheduledMinutesFor = (
  time?: string,
): number => {
  const [
    hour,
    minute,
  ] = String(time || '08:00')
    .split(':')
    .map(Number);

  const safeHour =
    Number.isFinite(hour)
      ? Math.min(
          23,
          Math.max(0, hour),
        )
      : 8;

  const safeMinute =
    Number.isFinite(minute)
      ? Math.min(
          59,
          Math.max(0, minute),
        )
      : 0;

  return (
    safeHour * 60 +
    safeMinute
  );
};

/**
 * Minimum configuration agar peptide
 * dapat muncul sebagai aktivitas Today.
 *
 * Wajib:
 * - jadwal
 * - dosis
 * - dial/volume calculation valid
 */
export const isInventoryConfigured = (
  item: InventoryItem,
): boolean => {
  if (!item?.injectionTime) {
    return false;
  }

  if (
    !Array.isArray(item.activeDays) ||
    item.activeDays.length === 0
  ) {
    return false;
  }

  const targetDose =
    Number(item.targetDose);

  if (
    !Number.isFinite(targetDose) ||
    targetDose <= 0
  ) {
    return false;
  }

  const metrics =
    calculateInjectionMetrics(item);

  return (
    metrics.valid &&
    metrics.volumeMlNumber > 0 &&
    metrics.dialClicks > 0
  );
};

/**
 * Menghasilkan occurrence untuk satu peptide
 * pada satu tanggal.
 *
 * Aturan Today:
 *
 * sebelum jadwal
 *      ↓
 * MENDATANG
 *
 * waktu jadwal sampai +3 jam
 *      ↓
 * JATUH TEMPO
 *
 * lewat +3 jam
 *      ↓
 * TERLEWAT
 *
 * sudah ada log
 *      ↓
 * SELESAI
 */
export const getOccurrenceForDate = (
  item: InventoryItem,
  date: Date,
  now = new Date(),
  logs: InjectionLog[] = [],
): ScheduledOccurrence | null => {
  if (
    !isInventoryConfigured(item)
  ) {
    return null;
  }

  if (
    !isInventoryScheduleActiveOnDate(
      item,
      date,
    )
  ) {
    return null;
  }

  const dateKey =
    formatLocalDate(date);

  const todayKey =
    formatLocalDate(now);

  const completed =
    hasCompletedOccurrence(
      item,
      date,
      logs,
    );

  const scheduledMinutes =
    scheduledMinutesFor(
      item.injectionTime,
    );

  const nowMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const isToday =
    dateKey === todayKey;

  /**
   * Jadwal sudah jatuh tempo tetapi
   * masih berada dalam window 3 jam.
   */
  const isDue =
    !completed &&
    isToday &&
    nowMinutes >= scheduledMinutes &&
    nowMinutes <
      scheduledMinutes + 180;

  /**
   * Baru dianggap TERLEWAT setelah
   * tepat 3 jam berlalu.
   */
  const isMissed =
    !completed &&
    isToday &&
    nowMinutes >=
      scheduledMinutes + 180;

  let status: OccurrenceStatus;

  if (completed) {
    status = 'completed';
  } else if (isMissed) {
    status = 'missed';
  } else if (isDue) {
    status = 'due';
  } else if (isToday) {
    status = 'upcoming';
  } else {
    status = 'upcoming';
  }

  return {
    inventoryId: item.id,
    peptideName: item.name,
    date: dateKey,
    time:
      item.injectionTime || '08:00',
    completed,
    missed: isMissed,
    status,
  };
};

/**
 * Menghasilkan jadwal beberapa hari.
 */
export const getScheduledOccurrences = (
  items: InventoryItem[],
  from = new Date(),
  days = 7,
  logs: InjectionLog[] = [],
): ScheduledOccurrence[] => {
  const occurrences: ScheduledOccurrence[] = [];

  const count = Math.max(
    1,
    Math.floor(days),
  );

  for (
    let offset = 0;
    offset < count;
    offset += 1
  ) {
    const date =
      new Date(from);

    date.setHours(
      12,
      0,
      0,
      0,
    );

    date.setDate(
      from.getDate() + offset,
    );

    items.forEach((item) => {
      const occurrence =
        getOccurrenceForDate(
          item,
          date,
          from,
          logs,
        );

      if (occurrence) {
        occurrences.push(
          occurrence,
        );
      }
    });
  }

  return occurrences.sort(
    (a, b) =>
      `${a.date}T${a.time}`.localeCompare(
        `${b.date}T${b.time}`,
      ),
  );
};

/**
 * Jadwal pada rentang tanggal tertentu.
 */
export const getScheduledOccurrencesBetween = (
  items: InventoryItem[],
  startDate: Date,
  endDate: Date,
  now = new Date(),
  logs: InjectionLog[] = [],
): ScheduledOccurrence[] => {
  const occurrences: ScheduledOccurrence[] = [];

  const cursor =
    new Date(startDate);

  cursor.setHours(
    12,
    0,
    0,
    0,
  );

  const end =
    new Date(endDate);

  end.setHours(
    12,
    0,
    0,
    0,
  );

  if (cursor > end) {
    return occurrences;
  }

  while (cursor <= end) {
    items.forEach((item) => {
      const occurrence =
        getOccurrenceForDate(
          item,
          cursor,
          now,
          logs,
        );

      if (occurrence) {
        occurrences.push(
          occurrence,
        );
      }
    });

    cursor.setDate(
      cursor.getDate() + 1,
    );
  }

  return occurrences.sort(
    (a, b) =>
      `${a.date}T${a.time}`.localeCompare(
        `${b.date}T${b.time}`,
      ),
  );
};

/**
 * Semua aktivitas hari ini.
 */
export const getTodayOccurrences = (
  items: InventoryItem[],
  now = new Date(),
  logs: InjectionLog[] = [],
): ScheduledOccurrence[] => {
  return getScheduledOccurrences(
    items,
    now,
    1,
    logs,
  );
};

/**
 * Mengambil occurrence terdekat dari
 * satu peptide.
 */
export const getNextScheduledOccurrence = (
  item: InventoryItem,
  from = new Date(),
  logs: InjectionLog[] = [],
  maxDays = 14,
): ScheduledOccurrence | null => {
  const occurrences =
    getScheduledOccurrences(
      [item],
      from,
      Math.max(
        1,
        maxDays + 1,
      ),
      logs,
    );

  const currentKey =
    formatLocalDate(from);

  /**
   * Jika hari ini masih memiliki aktivitas
   * yang belum selesai, prioritaskan itu.
   */
  const today =
    occurrences.find(
      (occurrence) =>
        occurrence.date ===
          currentKey &&
        occurrence.status !==
          'completed',
    );

  if (today) {
    return today;
  }

  /**
   * Jika semua hari ini sudah selesai,
   * cari jadwal berikutnya.
   */
  return (
    occurrences.find(
      (occurrence) =>
        occurrence.status ===
        'upcoming',
    ) || null
  );
};

/**
 * Ringkasan Today.
 */
export const getScheduleSummary = (
  items: InventoryItem[],
  logs: InjectionLog[],
  now = new Date(),
) => {
  const today =
    getTodayOccurrences(
      items,
      now,
      logs,
    );

  return {
    total: today.length,

    completed:
      today.filter(
        (item) =>
          item.status ===
          'completed',
      ).length,

    due:
      today.filter(
        (item) =>
          item.status ===
          'due',
      ).length,

    missed:
      today.filter(
        (item) =>
          item.status ===
          'missed',
      ).length,
  };
};

export const isDateWithinScheduleWindow = (
  item: InventoryItem,
  date: Date,
): boolean => {
  const start =
    parseDateKey(
      item.scheduleStartDate,
    );

  const end =
    parseDateKey(
      item.scheduleEndDate,
    );

  if (start && date < start) {
    return false;
  }

  if (end) {
    end.setHours(
      23,
      59,
      59,
      999,
    );

    if (date > end) {
      return false;
    }
  }

  return true;
};
