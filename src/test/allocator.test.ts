import { describe, it, expect } from 'vitest';
import {
  computeBaselineAllocation,
  computeRecommendedAllocation,
  computeBothAllocations,
  sortRequests,
} from '../domain/allocator';
import { SAMPLE_REQUESTS, SAMPLE_LAPTOPS } from '../domain/sampleData';
import { LoanRequest, LaptopAsset } from '../types/domain';
import { checkCompatibility } from '../domain/compatibility';

describe('Allocator - Golden Sample and Core Invariants', () => {
  it('correctly allocates the golden sample fixture', () => {
    const { baseline, recommended } = computeBothAllocations(
      SAMPLE_REQUESTS,
      SAMPLE_LAPTOPS
    );

    // Baseline: 2 of 4 served
    expect(baseline.servedCount).toBe(2);
    expect(baseline.totalRequests).toBe(4);
    expect(baseline.assignments['Q-01']).toBe('LT-01');
    expect(baseline.assignments['Q-02']).toBeUndefined(); // Waiting! Needs 16GB, LT-01 was taken
    expect(baseline.assignments['Q-03']).toBe('LT-03');
    expect(baseline.assignments['Q-04']).toBeUndefined(); // Waiting! Needs battery, LT-03 has no battery, LT-04 in repair

    // Recommended: 3 of 4 served
    expect(recommended.servedCount).toBe(3);
    expect(recommended.totalRequests).toBe(4);
    expect(recommended.assignments['Q-01']).toBe('LT-02'); // Reassigned to 8GB
    expect(recommended.assignments['Q-02']).toBe('LT-01'); // Unlocked 16GB
    expect(recommended.assignments['Q-03']).toBe('LT-03');
    expect(recommended.assignments['Q-04']).toBeUndefined(); // Still waiting (repair needed)

    // Check outcome flags
    const q1Outcome = recommended.outcomes.find((o) => o.requestId === 'Q-01')!;
    expect(q1Outcome.isMatched).toBe(true);
    expect(q1Outcome.isChangedFromBaseline).toBe(true);

    const q2Outcome = recommended.outcomes.find((o) => o.requestId === 'Q-02')!;
    expect(q2Outcome.isMatched).toBe(true);
    expect(q2Outcome.isChangedFromBaseline).toBe(true);

    const q3Outcome = recommended.outcomes.find((o) => o.requestId === 'Q-03')!;
    expect(q3Outcome.isMatched).toBe(true);
    expect(q3Outcome.isChangedFromBaseline).toBe(false);

    const q4Outcome = recommended.outcomes.find((o) => o.requestId === 'Q-04')!;
    expect(q4Outcome.isMatched).toBe(false);
    expect(q4Outcome.isChangedFromBaseline).toBe(false);
  });

  it('guarantees matching invariants: each request gets <= 1 laptop, each laptop used <= 1 time, all edges compatible', () => {
    const { baseline, recommended } = computeBothAllocations(
      SAMPLE_REQUESTS,
      SAMPLE_LAPTOPS
    );

    for (const res of [baseline, recommended]) {
      const assignedLaptops = Object.values(res.assignments);
      const uniqueLaptops = new Set(assignedLaptops);
      expect(assignedLaptops.length).toBe(uniqueLaptops.size); // No laptop shared

      for (const [rId, aId] of Object.entries(res.assignments)) {
        const req = SAMPLE_REQUESTS.find((r) => r.id === rId)!;
        const lap = SAMPLE_LAPTOPS.find((l) => l.id === aId)!;
        const comp = checkCompatibility(req, lap);
        expect(comp.isCompatible).toBe(true);
      }
    }
  });

  it('is completely stable when input arrays are shuffled', () => {
    const shuffledReqs = [...SAMPLE_REQUESTS].reverse();
    const shuffledLaptops = [...SAMPLE_LAPTOPS].reverse();

    const normal = computeRecommendedAllocation(SAMPLE_REQUESTS, SAMPLE_LAPTOPS);
    const shuffled = computeRecommendedAllocation(shuffledReqs, shuffledLaptops);

    expect(normal.servedCount).toBe(shuffled.servedCount);
    expect(normal.assignments).toEqual(shuffled.assignments);
  });

  it('breaks timestamp ties deterministically by request ID', () => {
    const tiedReqs: LoanRequest[] = [
      {
        id: 'Q-B',
        queueTimestamp: '2026-11-20T09:00:00Z',
        allowedDesks: ['North'],
        minRamGb: 8,
        batteryRequired: false,
      },
      {
        id: 'Q-A',
        queueTimestamp: '2026-11-20T09:00:00Z',
        allowedDesks: ['North'],
        minRamGb: 8,
        batteryRequired: false,
      },
    ];

    const sorted = sortRequests(tiedReqs);
    expect(sorted[0].id).toBe('Q-A');
    expect(sorted[1].id).toBe('Q-B');

    // With only 1 available laptop, Q-A must get it due to tie break
    const singleLaptop: LaptopAsset[] = [
      {
        id: 'LT-01',
        pickupDesk: 'North',
        ramGb: 8,
        chargerVerified: 'yes',
        batteryVerified: 'yes',
        status: 'Ready',
      },
    ];

    const res = computeRecommendedAllocation(tiedReqs, singleLaptop);
    expect(res.assignments['Q-A']).toBe('LT-01');
    expect(res.assignments['Q-B']).toBeUndefined();
  });

  it('handles empty requests or empty inventory cleanly', () => {
    const empty1 = computeBothAllocations([], SAMPLE_LAPTOPS);
    expect(empty1.baseline.servedCount).toBe(0);
    expect(empty1.recommended.servedCount).toBe(0);

    const empty2 = computeBothAllocations(SAMPLE_REQUESTS, []);
    expect(empty2.baseline.servedCount).toBe(0);
    expect(empty2.recommended.servedCount).toBe(0);

    const empty3 = computeBothAllocations([], []);
    expect(empty3.baseline.servedCount).toBe(0);
    expect(empty3.recommended.servedCount).toBe(0);
  });

  it('handles multi-hop augmenting paths requiring more than one move', () => {
    // Construct chain:
    // Q-1 (earliest) takes LT-1. But Q-1 could also use LT-2.
    // Q-2 (second) takes LT-2. But Q-2 could also use LT-3.
    // Q-3 arrives, and can ONLY use LT-1!
    // Augmenting path: Q-3 -> LT-1 -> Q-1 -> LT-2 -> Q-2 -> LT-3 (free).
    // All 3 should be served!

    const requests: LoanRequest[] = [
      {
        id: 'Q-1',
        queueTimestamp: '2026-11-20T01:00:00Z',
        allowedDesks: ['North'],
        minRamGb: 8, // can use LT-1 (16GB) or LT-2 (8GB)
        batteryRequired: false,
      },
      {
        id: 'Q-2',
        queueTimestamp: '2026-11-20T02:00:00Z',
        allowedDesks: ['North'],
        minRamGb: 8, // can use LT-2 (8GB) or LT-3 (8GB)
        batteryRequired: false,
      },
      {
        id: 'Q-3',
        queueTimestamp: '2026-11-20T03:00:00Z',
        allowedDesks: ['North'],
        minRamGb: 16, // can ONLY use LT-1 (16GB)!
        batteryRequired: false,
      },
    ];

    const laptops: LaptopAsset[] = [
      {
        id: 'LT-1',
        pickupDesk: 'North',
        ramGb: 16,
        chargerVerified: 'yes',
        batteryVerified: 'yes',
        status: 'Ready',
      },
      {
        id: 'LT-2',
        pickupDesk: 'North',
        ramGb: 8,
        chargerVerified: 'yes',
        batteryVerified: 'yes',
        status: 'Ready',
      },
      {
        id: 'LT-3',
        pickupDesk: 'North',
        ramGb: 8,
        chargerVerified: 'yes',
        batteryVerified: 'yes',
        status: 'Ready',
      },
    ];

    // Baseline heuristic:
    // Q-1 takes LT-1 (first ASCII)
    // Q-2 takes LT-2 (first available ASCII)
    // Q-3 needs LT-1 (16GB), but LT-1 is already taken. LT-3 has only 8GB.
    // Baseline only serves 2 of 3!
    const baseline = computeBaselineAllocation(requests, laptops);
    expect(baseline.servedCount).toBe(2);
    expect(baseline.assignments['Q-1']).toBe('LT-1');
    expect(baseline.assignments['Q-2']).toBe('LT-2');
    expect(baseline.assignments['Q-3']).toBeUndefined();

    // Recommended augmenting path:
    // Multi-hop shift: Q-3 takes LT-1, propagating reassignments across all 3 laptops
    // Recommended serves all 3 of 3!
    const recommended = computeRecommendedAllocation(requests, laptops);
    expect(recommended.servedCount).toBe(3);
    expect(recommended.assignments['Q-3']).toBe('LT-1');
    expect(recommended.assignments['Q-2']).toBe('LT-2');
    expect(recommended.assignments['Q-1']).toBe('LT-3');
  });

  it('preserves existing pairs when a path search fails', () => {
    // 2 requests, 1 laptop.
    // Q-1 takes LT-1.
    // Q-2 needs LT-1 or LT-2. But LT-2 does not exist.
    // Path search for Q-2 fails.
    // Q-1 must remain safely assigned to LT-1!
    const reqs: LoanRequest[] = [
      {
        id: 'Q-1',
        queueTimestamp: '2026-11-20T01:00:00Z',
        allowedDesks: ['North'],
        minRamGb: 8,
        batteryRequired: false,
      },
      {
        id: 'Q-2',
        queueTimestamp: '2026-11-20T02:00:00Z',
        allowedDesks: ['North'],
        minRamGb: 8,
        batteryRequired: false,
      },
    ];

    const laptops: LaptopAsset[] = [
      {
        id: 'LT-1',
        pickupDesk: 'North',
        ramGb: 8,
        chargerVerified: 'yes',
        batteryVerified: 'yes',
        status: 'Ready',
      },
    ];

    const res = computeRecommendedAllocation(reqs, laptops);
    expect(res.servedCount).toBe(1);
    expect(res.assignments['Q-1']).toBe('LT-1');
    expect(res.assignments['Q-2']).toBeUndefined();
  });

  it('tests where both policies match the same number', () => {
    // When stock is plentiful and non-conflicting
    const reqs: LoanRequest[] = [
      {
        id: 'Q-1',
        queueTimestamp: '2026-11-20T01:00:00Z',
        allowedDesks: ['North'],
        minRamGb: 8,
        batteryRequired: false,
      },
      {
        id: 'Q-2',
        queueTimestamp: '2026-11-20T02:00:00Z',
        allowedDesks: ['South'],
        minRamGb: 8,
        batteryRequired: false,
      },
    ];

    const laptops: LaptopAsset[] = [
      {
        id: 'LT-N',
        pickupDesk: 'North',
        ramGb: 8,
        chargerVerified: 'yes',
        batteryVerified: 'yes',
        status: 'Ready',
      },
      {
        id: 'LT-S',
        pickupDesk: 'South',
        ramGb: 8,
        chargerVerified: 'yes',
        batteryVerified: 'yes',
        status: 'Ready',
      },
    ];

    const { baseline, recommended } = computeBothAllocations(reqs, laptops);
    expect(baseline.servedCount).toBe(2);
    expect(recommended.servedCount).toBe(2);
    expect(baseline.assignments).toEqual(recommended.assignments);
  });
});
