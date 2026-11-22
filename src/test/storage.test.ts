import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadWorkspace,
  saveWorkspace,
  clearSavedWorkspace,
  STORAGE_KEY,
  validateLoanRequest,
  validateLaptopAsset,
} from '../storage/storage';
import { INITIAL_WORKSPACE, SAMPLE_REQUESTS } from '../domain/sampleData';
import { WorkspaceData } from '../types/domain';

describe('Storage and Serialization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads INITIAL_WORKSPACE when storage is empty', () => {
    const res = loadWorkspace();
    expect(res.status).toBe('DEFAULT');
    expect(res.data.requests).toHaveLength(INITIAL_WORKSPACE.requests.length);
    expect(res.data.laptops).toHaveLength(INITIAL_WORKSPACE.laptops.length);
  });

  it('saves and loads valid workspace data round-trip', () => {
    const customData: WorkspaceData = {
      version: 1,
      requests: [SAMPLE_REQUESTS[0]],
      laptops: [],
      updatedAt: '2026-11-20T12:00:00Z',
    };

    const saveRes = saveWorkspace(customData);
    expect(saveRes.success).toBe(true);

    const loadRes = loadWorkspace();
    expect(loadRes.status).toBe('OK');
    expect(loadRes.data.requests).toHaveLength(1);
    expect(loadRes.data.requests[0].id).toBe('Q-01');
  });

  it('handles corrupted unparseable JSON gracefully and preserves raw string', () => {
    localStorage.setItem(STORAGE_KEY, '{"version": 1, "requests": [malformed json...');

    const res = loadWorkspace();
    expect(res.status).toBe('CORRUPTED_JSON');
    expect(res.data).toEqual(INITIAL_WORKSPACE);
    expect(res.rawMalformed).toBeDefined();
    expect(res.errorMessage).toBeDefined();
  });

  it('handles unsupported schema version gracefully', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, requests: [], laptops: [] }));

    const res = loadWorkspace();
    expect(res.status).toBe('UNSUPPORTED_VERSION');
    expect(res.errorMessage).toContain('99');
  });

  it('handles invalid schema fields', () => {
    // Missing required field minRamGb
    const badData = {
      version: 1,
      requests: [{ id: 'Q-BAD', queueTimestamp: '2026-11-20T09:00:00Z', allowedDesks: ['North'] }],
      laptops: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(badData));

    const res = loadWorkspace();
    expect(res.status).toBe('INVALID_SCHEMA');
    expect(res.errorMessage).toBeDefined();
  });

  it('clears storage explicitly when requested', () => {
    saveWorkspace(INITIAL_WORKSPACE);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    clearSavedWorkspace();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('validates single loan request accurately', () => {
    expect(validateLoanRequest(SAMPLE_REQUESTS[0])).toBe(true);
    expect(validateLoanRequest({ ...SAMPLE_REQUESTS[0], minRamGb: 64 })).toBe(false); // 64 not in [4,8,16,32]
    expect(validateLoanRequest({ ...SAMPLE_REQUESTS[0], allowedDesks: [] })).toBe(false); // empty desks
    expect(validateLoanRequest({ ...SAMPLE_REQUESTS[0], id: '' })).toBe(false); // empty id
  });

  it('validates single laptop asset accurately', () => {
    expect(validateLaptopAsset(INITIAL_WORKSPACE.laptops[0])).toBe(true);
    expect(validateLaptopAsset({ ...INITIAL_WORKSPACE.laptops[0], status: 'Broken' })).toBe(false);
    expect(validateLaptopAsset({ ...INITIAL_WORKSPACE.laptops[0], chargerVerified: 'maybe' })).toBe(false);
  });
});
