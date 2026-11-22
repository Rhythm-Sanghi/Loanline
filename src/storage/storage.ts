import { WorkspaceData, LoanRequest, LaptopAsset } from '../types/domain';
import { INITIAL_WORKSPACE } from '../domain/sampleData';

export const STORAGE_KEY = 'loanline_workspace_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export type StorageLoadStatus =
  | 'OK'
  | 'DEFAULT'
  | 'CORRUPTED_JSON'
  | 'INVALID_SCHEMA'
  | 'UNSUPPORTED_VERSION'
  | 'STORAGE_UNAVAILABLE';

export interface StorageLoadResult {
  data: WorkspaceData;
  status: StorageLoadStatus;
  errorMessage?: string;
  rawMalformed?: string;
}

const VALID_RAMS: Set<number> = new Set([4, 8, 16, 32]);
const VALID_YES_NO: Set<string> = new Set(['yes', 'no']);
const VALID_STATUSES: Set<string> = new Set(['Ready', 'Repair', 'Held']);

export function validateLoanRequest(obj: any): obj is LoanRequest {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.id !== 'string' || obj.id.trim() === '') return false;
  if (typeof obj.queueTimestamp !== 'string' || isNaN(Date.parse(obj.queueTimestamp))) return false;
  if (!Array.isArray(obj.allowedDesks) || obj.allowedDesks.length === 0) return false;
  if (typeof obj.minRamGb !== 'number' || !VALID_RAMS.has(obj.minRamGb)) return false;
  if (typeof obj.batteryRequired !== 'boolean') return false;
  return true;
}

export function validateLaptopAsset(obj: any): obj is LaptopAsset {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.id !== 'string' || obj.id.trim() === '') return false;
  if (typeof obj.pickupDesk !== 'string' || obj.pickupDesk.trim() === '') return false;
  if (typeof obj.ramGb !== 'number' || !VALID_RAMS.has(obj.ramGb)) return false;
  if (typeof obj.chargerVerified !== 'string' || !VALID_YES_NO.has(obj.chargerVerified)) return false;
  if (typeof obj.batteryVerified !== 'string' || !VALID_YES_NO.has(obj.batteryVerified)) return false;
  if (typeof obj.status !== 'string' || !VALID_STATUSES.has(obj.status)) return false;
  return true;
}

export function validateWorkspaceData(obj: any): { isValid: boolean; error?: string } {
  if (!obj || typeof obj !== 'object') {
    return { isValid: false, error: 'Saved state is not an object.' };
  }
  if (typeof obj.version !== 'number') {
    return { isValid: false, error: 'Missing or non-numeric schema version.' };
  }
  if (obj.version !== CURRENT_SCHEMA_VERSION) {
    return { isValid: false, error: `Unsupported version ${obj.version}. Expected ${CURRENT_SCHEMA_VERSION}.` };
  }
  if (!Array.isArray(obj.requests) || !obj.requests.every(validateLoanRequest)) {
    return { isValid: false, error: 'One or more requests are malformed or invalid.' };
  }
  if (!Array.isArray(obj.laptops) || !obj.laptops.every(validateLaptopAsset)) {
    return { isValid: false, error: 'One or more inventory laptops are malformed or invalid.' };
  }
  return { isValid: true };
}

/**
 * Loads workspace from localStorage safely.
 */
export function loadWorkspace(): StorageLoadResult {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        data: INITIAL_WORKSPACE,
        status: 'STORAGE_UNAVAILABLE',
        errorMessage: 'Local storage is unavailable in this environment.',
      };
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        data: INITIAL_WORKSPACE,
        status: 'DEFAULT',
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      return {
        data: INITIAL_WORKSPACE,
        status: 'CORRUPTED_JSON',
        errorMessage: 'Existing saved data contains unparseable JSON.',
        rawMalformed: raw,
      };
    }

    if (parsed.version && parsed.version !== CURRENT_SCHEMA_VERSION) {
      return {
        data: INITIAL_WORKSPACE,
        status: 'UNSUPPORTED_VERSION',
        errorMessage: `Found schema version ${parsed.version}, but Loanline requires version ${CURRENT_SCHEMA_VERSION}.`,
        rawMalformed: raw,
      };
    }

    const validation = validateWorkspaceData(parsed);
    if (!validation.isValid) {
      return {
        data: INITIAL_WORKSPACE,
        status: 'INVALID_SCHEMA',
        errorMessage: validation.error || 'Stored data failed schema validation.',
        rawMalformed: raw,
      };
    }

    return {
      data: parsed as WorkspaceData,
      status: 'OK',
    };
  } catch (err: any) {
    return {
      data: INITIAL_WORKSPACE,
      status: 'STORAGE_UNAVAILABLE',
      errorMessage: err?.message || 'Access to localStorage was blocked or failed.',
    };
  }
}

/**
 * Saves workspace to localStorage safely.
 */
export function saveWorkspace(data: WorkspaceData): { success: boolean; error?: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        success: false,
        error: 'localStorage is unavailable. Edits will be lost on reload.',
      };
    }

    const serialized = JSON.stringify(data);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: `Could not save to localStorage: ${err?.message || 'Quota exceeded or storage blocked.'}. Edits will be lost on reload.`,
    };
  }
}

/**
 * Clears workspace data in localStorage.
 */
export function clearSavedWorkspace(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
      return true;
    }
  } catch {
    // Ignore clear error
  }
  return false;
}
