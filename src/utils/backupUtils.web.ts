import type { BioStackBackupPayload } from '../store/useBioStackStore';

const BACKUP_FORMAT = 'biostack-pro-backup' as const;
const BACKUP_VERSION = 1;

const isObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function buildBackupPayload(
  data: BioStackBackupPayload['data'],
  appVersion = '1.0.0',
): BioStackBackupPayload {
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_VERSION,
    appVersion,
    schemaVersion: 5,
    exportedAt: new Date().toISOString(),
    data: {
      inventory: data.inventory,
      freezerStock: data.freezerStock,
      injectionHistory: data.injectionHistory,
      currentSite: data.currentSite,
      settings: {
        allowAiNetwork: Boolean(
          data.settings?.allowAiNetwork,
        ),
        aiProvider:
          data.settings?.aiProvider === 'openai'
            ? 'openai'
            : 'gemini',
      },
    },
  };
}

export function validateBackupPayload(
  value: unknown,
): {
  valid: boolean;
  payload?: BioStackBackupPayload;
  error?: string;
} {
  if (
    !isObject(value) ||
    value.format !== BACKUP_FORMAT
  ) {
    return {
      valid: false,
      error: 'Format backup tidak dikenali.',
    };
  }

  if (
    value.formatVersion !== BACKUP_VERSION
  ) {
    return {
      valid: false,
      error: `Versi backup ${String(
        value.formatVersion,
      )} tidak didukung.`,
    };
  }

  if (!isObject(value.data)) {
    return {
      valid: false,
      error: 'Bagian data backup tidak ditemukan.',
    };
  }

  const data = value.data;

  if (
    !Array.isArray(data.inventory) ||
    !Array.isArray(data.freezerStock) ||
    !Array.isArray(data.injectionHistory)
  ) {
    return {
      valid: false,
      error:
        'Data inventory/freezer/history tidak valid.',
    };
  }

  if (typeof data.currentSite !== 'string') {
    return {
      valid: false,
      error:
        'Titik rotasi saat ini tidak valid.',
    };
  }

  return {
    valid: true,
    payload:
      value as unknown as BioStackBackupPayload,
  };
}

export async function exportBackupFile(
  payload: BioStackBackupPayload,
): Promise<string> {
  const json = JSON.stringify(
    payload,
    null,
    2,
  );

  const blob = new Blob([json], {
    type: 'application/json;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);

  const stamp = payload.exportedAt
    .replace(/[:.]/g, '-');

  const filename =
    `BioStack_PRO_Backup_${stamp}.json`;

  const anchor =
    document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return filename;
}

export async function readBackupFile(
  uri: string,
): Promise<{
  valid: boolean;
  payload?: BioStackBackupPayload;
  error?: string;
}> {
  try {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`,
      );
    }

    const raw = await response.text();

    return validateBackupPayload(
      JSON.parse(raw),
    );
  } catch {
    return {
      valid: false,
      error:
        'File backup tidak dapat dibaca atau JSON rusak.',
    };
  }
}
