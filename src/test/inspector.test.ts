import { describe, it, expect } from 'vitest';
import { explainRequest, simulateRepairPreview } from '../domain/inspector';
import { computeBothAllocations } from '../domain/allocator';
import { SAMPLE_REQUESTS, SAMPLE_LAPTOPS } from '../domain/sampleData';
import { LaptopAsset } from '../types/domain';

describe('Inspector and Repair Preview', () => {
  const { baseline, recommended } = computeBothAllocations(
    SAMPLE_REQUESTS,
    SAMPLE_LAPTOPS
  );

  it('generates accurate structured explanation for Q-01 (reassigned)', () => {
    const q1 = SAMPLE_REQUESTS.find((r) => r.id === 'Q-01')!;
    const explanation = explainRequest(q1, SAMPLE_LAPTOPS, recommended, baseline);

    expect(explanation.statusCode).toBe('MATCHED_REASSIGNED');
    expect(explanation.isMatched).toBe(true);
    expect(explanation.isChangedFromBaseline).toBe(true);
    expect(explanation.assignedAssetId).toBe('LT-02');
    expect(explanation.baselineAssetId).toBe('LT-01');
    expect(explanation.summary).toContain('LT-01');
    expect(explanation.summary).toContain('LT-02');
  });

  it('generates accurate structured explanation for Q-02 (newly served)', () => {
    const q2 = SAMPLE_REQUESTS.find((r) => r.id === 'Q-02')!;
    const explanation = explainRequest(q2, SAMPLE_LAPTOPS, recommended, baseline);

    expect(explanation.statusCode).toBe('MATCHED_NEW');
    expect(explanation.isMatched).toBe(true);
    expect(explanation.isChangedFromBaseline).toBe(true);
    expect(explanation.assignedAssetId).toBe('LT-01');
    expect(explanation.baselineAssetId).toBeNull();
  });

  it('generates accurate structured explanation for Q-03 (same assignment)', () => {
    const q3 = SAMPLE_REQUESTS.find((r) => r.id === 'Q-03')!;
    const explanation = explainRequest(q3, SAMPLE_LAPTOPS, recommended, baseline);

    expect(explanation.statusCode).toBe('MATCHED_SAME');
    expect(explanation.isMatched).toBe(true);
    expect(explanation.isChangedFromBaseline).toBe(false);
    expect(explanation.assignedAssetId).toBe('LT-03');
  });

  it('generates accurate structured explanation for Q-04 (waiting, no compatible)', () => {
    const q4 = SAMPLE_REQUESTS.find((r) => r.id === 'Q-04')!;
    const explanation = explainRequest(q4, SAMPLE_LAPTOPS, recommended, baseline);

    expect(explanation.statusCode).toBe('WAITING_NO_COMPATIBLE');
    expect(explanation.isMatched).toBe(false);
    expect(explanation.assignedAssetId).toBeNull();
    expect(explanation.headline).toBe('No compatible laptop');
    expect(explanation.blockingReasons.length).toBeGreaterThan(0);

    // Should note battery requirement and South desk stock
    const combinedBlockers = explanation.blockingReasons.join(' ');
    expect(combinedBlockers).toContain('battery');
  });

  it('simulates repair preview for LT-04 accurately (3 of 4 -> 4 of 4)', () => {
    const preview = simulateRepairPreview('LT-04', SAMPLE_REQUESTS, SAMPLE_LAPTOPS, recommended);
    expect(preview).not.toBeNull();
    if (!preview) return;

    expect(preview.targetAssetId).toBe('LT-04');
    expect(preview.originalStatus).toBe('Repair');
    expect(preview.previewStatus).toBe('Ready');
    expect(preview.beforeServedCount).toBe(3);
    expect(preview.afterServedCount).toBe(4);
    expect(preview.newlyServedRequestIds).toEqual(['Q-04']);
    expect(preview.remainingWaitingRequestIds).toEqual([]);
    expect(preview.changedPairings).toHaveLength(1);
    expect(preview.changedPairings[0]).toEqual({
      requestId: 'Q-04',
      fromAssetId: null,
      toAssetId: 'LT-04',
    });
    expect(preview.remainingBlockers).toHaveLength(0);
  });

  it('proves that simulateRepairPreview does NOT mutate the original inventory', () => {
    const originalLt4 = SAMPLE_LAPTOPS.find((l) => l.id === 'LT-04')!;
    expect(originalLt4.status).toBe('Repair');

    simulateRepairPreview('LT-04', SAMPLE_REQUESTS, SAMPLE_LAPTOPS, recommended);

    // Verify original object is untouched
    expect(originalLt4.status).toBe('Repair');
  });

  it('identifies remaining blockers when repair alone is insufficient (e.g. unverified charger)', () => {
    const laptopsWithUnverifiedCharger: LaptopAsset[] = SAMPLE_LAPTOPS.map((l) =>
      l.id === 'LT-04' ? { ...l, chargerVerified: 'no' } : { ...l }
    );

    const preview = simulateRepairPreview(
      'LT-04',
      SAMPLE_REQUESTS,
      laptopsWithUnverifiedCharger,
      recommended
    );

    expect(preview).not.toBeNull();
    if (!preview) return;

    // Because charger is still unverified, even though status is Ready, it cannot be assigned
    expect(preview.remainingBlockers.length).toBeGreaterThan(0);
    expect(preview.remainingBlockers[0]).toContain('Charger');
    expect(preview.afterServedCount).toBe(3); // Count did not increase
  });

  it('returns null if preview is requested on a laptop not in Repair status', () => {
    const preview = simulateRepairPreview('LT-01', SAMPLE_REQUESTS, SAMPLE_LAPTOPS, recommended);
    expect(preview).toBeNull();
  });
});
