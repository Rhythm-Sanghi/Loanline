import { describe, it, expect } from 'vitest';
import { computeRecommendedAllocation, sortRequests, sortLaptops } from '../domain/allocator';
import { checkCompatibility } from '../domain/compatibility';
import { LoanRequest, LaptopAsset, RamGb, LaptopStatus } from '../types/domain';

// Simple pseudo-random generator with a seed for deterministic testing
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Brute-force oracle for small graphs (<= 6 requests, <= 6 laptops).
 * Checks all possible matchings to determine:
 * 1. The exact maximum matching cardinality
 * 2. The lexicographically earliest subset of requests in queue order
 */
function bruteForceOptimalRequestSet(
  requests: LoanRequest[],
  laptops: LaptopAsset[]
): { maxSize: number; bestSubsetReqIds: Set<string> } {
  const sortedReqs = sortRequests(requests);
  const sortedLaptops = sortLaptops(laptops);
  const n = sortedReqs.length;
  const m = sortedLaptops.length;

  // Build adjacency matrix: adj[i][j] = isCompatible(sortedReqs[i], sortedLaptops[j])
  const adj: boolean[][] = [];
  for (let i = 0; i < n; i++) {
    adj[i] = [];
    for (let j = 0; j < m; j++) {
      adj[i][j] = checkCompatibility(sortedReqs[i], sortedLaptops[j]).isCompatible;
    }
  }

  // Check if a given subset of requests can be matched to laptops
  function canMatchSubset(reqIndices: number[]): boolean {
    const k = reqIndices.length;
    if (k === 0) return true;
    if (k > m) return false;

    // Try all injective mappings from reqIndices to laptop indices
    function search(rIdx: number, usedLaptops: Set<number>): boolean {
      if (rIdx === k) return true;
      const reqId = reqIndices[rIdx];
      for (let l = 0; l < m; l++) {
        if (!usedLaptops.has(l) && adj[reqId][l]) {
          usedLaptops.add(l);
          if (search(rIdx + 1, usedLaptops)) return true;
          usedLaptops.delete(l);
        }
      }
      return false;
    }

    return search(0, new Set<number>());
  }

  // Iterate over all 2^n subsets of requests
  // To find lexicographically earliest, we order subsets by size desc, then lexicographically by bitmask
  let maxMatchSize = 0;
  const matchableSubsets: number[][] = [];

  const totalSubsets = 1 << n;
  for (let mask = 0; mask < totalSubsets; mask++) {
    const subset: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << (n - 1 - i))) {
        subset.push(i);
      }
    }
    if (canMatchSubset(subset)) {
      if (subset.length > maxMatchSize) {
        maxMatchSize = subset.length;
      }
      matchableSubsets.push(subset);
    }
  }

  // Filter to only subsets of maxMatchSize
  const maxSubsets = matchableSubsets.filter((s) => s.length === maxMatchSize);

  // Compare lexicographically in queue order:
  // Prefer the subset that includes request 0; if tied, request 1, etc.
  function compareSubsets(a: number[], b: number[]): number {
    const aSet = new Set(a);
    const bSet = new Set(b);
    for (let i = 0; i < n; i++) {
      const hasA = aSet.has(i);
      const hasB = bSet.has(i);
      if (hasA !== hasB) {
        return hasA ? -1 : 1; // hasA is preferred
      }
    }
    return 0;
  }

  maxSubsets.sort(compareSubsets);
  const best = maxSubsets[0] || [];
  const bestSubsetReqIds = new Set(best.map((idx) => sortedReqs[idx].id));

  return { maxSize: maxMatchSize, bestSubsetReqIds };
}

describe('Seeded Brute-Force Oracle vs Recommended Allocator', () => {
  const RAM_OPTIONS: RamGb[] = [4, 8, 16, 32];
  const DESK_OPTIONS = ['North', 'South'];
  const STATUS_OPTIONS: LaptopStatus[] = ['Ready', 'Repair', 'Held'];

  // Test across 15 seeded random problem instances of size 4-5
  for (let trial = 1; trial <= 15; trial++) {
    it(`trial ${trial}: matches brute-force oracle in size and queue preference`, () => {
      const rng = createRng(trial * 1000 + 42);

      const numReqs = 4 + Math.floor(rng() * 2); // 4 or 5
      const numLaptops = 4 + Math.floor(rng() * 2); // 4 or 5

      const requests: LoanRequest[] = [];
      for (let i = 0; i < numReqs; i++) {
        const desk = DESK_OPTIONS[Math.floor(rng() * DESK_OPTIONS.length)];
        const ram = RAM_OPTIONS[Math.floor(rng() * RAM_OPTIONS.length)];
        const battReq = rng() > 0.6;
        requests.push({
          id: `Q-${String(i + 1).padStart(2, '0')}`,
          queueTimestamp: `2026-11-20T09:${String(i * 10).padStart(2, '0')}:00Z`,
          allowedDesks: [desk],
          minRamGb: ram,
          batteryRequired: battReq,
        });
      }

      const laptops: LaptopAsset[] = [];
      for (let j = 0; j < numLaptops; j++) {
        const desk = DESK_OPTIONS[Math.floor(rng() * DESK_OPTIONS.length)];
        const ram = RAM_OPTIONS[Math.floor(rng() * RAM_OPTIONS.length)];
        const status = rng() > 0.3 ? 'Ready' : (STATUS_OPTIONS[Math.floor(rng() * STATUS_OPTIONS.length)]);
        const charger = rng() > 0.2 ? 'yes' : 'no';
        const battery = rng() > 0.4 ? 'yes' : 'no';
        laptops.push({
          id: `LT-${String(j + 1).padStart(2, '0')}`,
          pickupDesk: desk,
          ramGb: ram,
          chargerVerified: charger,
          batteryVerified: battery,
          status,
        });
      }

      const oracle = bruteForceOptimalRequestSet(requests, laptops);
      const result = computeRecommendedAllocation(requests, laptops);

      // 1. Cardinality must match oracle's maximum cardinality
      expect(result.servedCount).toBe(oracle.maxSize);

      // 2. The set of served requests must match the oracle's lexicographically earliest set
      const allocatedReqIds = new Set(Object.keys(result.assignments));
      expect(allocatedReqIds).toEqual(oracle.bestSubsetReqIds);

      // 3. Every edge in the allocation must be valid and compatible
      for (const [rId, aId] of Object.entries(result.assignments)) {
        const req = requests.find((r) => r.id === rId)!;
        const lap = laptops.find((l) => l.id === aId)!;
        expect(checkCompatibility(req, lap).isCompatible).toBe(true);
      }
    });
  }
});
