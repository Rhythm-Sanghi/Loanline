import {
  LoanRequest,
  LaptopAsset,
  AllocationResult,
  AssignmentOutcome,
} from '../types/domain';
import { checkCompatibility } from './compatibility';

export const MAX_REQUESTS = 100;
export const MAX_LAPTOPS = 100;

/**
 * Normalizes and sorts requests by queue timestamp ascending,
 * breaking ties deterministically by stable ID (ASCII order).
 */
export function sortRequests(requests: LoanRequest[]): LoanRequest[] {
  return [...requests]
    .slice(0, MAX_REQUESTS)
    .sort((a, b) => {
      const timeComp = a.queueTimestamp.localeCompare(b.queueTimestamp);
      if (timeComp !== 0) return timeComp;
      return a.id.localeCompare(b.id);
    });
}

/**
 * Normalizes and sorts laptops deterministically by asset ID (ASCII order).
 */
export function sortLaptops(laptops: LaptopAsset[]): LaptopAsset[] {
  return [...laptops]
    .slice(0, MAX_LAPTOPS)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Baseline policy:
 * "Queue order · first compatible laptop"
 * Greedy first-fit in queue order.
 */
export function computeBaselineAllocation(
  requests: LoanRequest[],
  laptops: LaptopAsset[]
): AllocationResult {
  const sortedReqs = sortRequests(requests);
  const sortedLaptops = sortLaptops(laptops);

  const assignments: Record<string, string> = {};
  const reverseAssignments: Record<string, string> = {};
  const assignedLaptopIds = new Set<string>();

  for (const req of sortedReqs) {
    for (const laptop of sortedLaptops) {
      if (assignedLaptopIds.has(laptop.id)) continue;
      if (checkCompatibility(req, laptop).isCompatible) {
        assignments[req.id] = laptop.id;
        reverseAssignments[laptop.id] = req.id;
        assignedLaptopIds.add(laptop.id);
        break;
      }
    }
  }

  const outcomes: AssignmentOutcome[] = sortedReqs.map((req) => {
    const assetId = assignments[req.id] || null;
    return {
      requestId: req.id,
      assetId,
      isMatched: assetId !== null,
      isChangedFromBaseline: false,
    };
  });

  return {
    policyId: 'baseline',
    policyName: 'Queue order · first compatible laptop',
    policyDescription:
      'Greedy reference heuristic: requests take the first available compatible laptop in inventory order without reassigning earlier matches.',
    assignments,
    reverseAssignments,
    outcomes,
    servedCount: Object.keys(assignments).length,
    totalRequests: sortedReqs.length,
  };
}

interface PathStep {
  requestId: string;
  assetId: string;
}

/**
 * Searches for an augmenting path starting from `requestId` to any free compatible laptop.
 * Explores eligible assets in deterministic ASCII order.
 * If an asset is occupied, recursively searches for an alternative compatible asset for the occupant.
 */
function findAugmentingPath(
  currentReqId: string,
  visitedAssets: Set<string>,
  reqMap: Map<string, LoanRequest>,
  sortedLaptops: LaptopAsset[],
  matchL: Map<string, string>
): PathStep[] | null {
  const req = reqMap.get(currentReqId);
  if (!req) return null;

  for (const laptop of sortedLaptops) {
    if (visitedAssets.has(laptop.id)) continue;
    if (!checkCompatibility(req, laptop).isCompatible) continue;

    visitedAssets.add(laptop.id);

    const occupantReqId = matchL.get(laptop.id);
    if (!occupantReqId) {
      // Reached a free eligible asset!
      return [{ requestId: currentReqId, assetId: laptop.id }];
    }

    // Asset is occupied: see if the current occupant can be shifted
    const subPath = findAugmentingPath(
      occupantReqId,
      visitedAssets,
      reqMap,
      sortedLaptops,
      matchL
    );

    if (subPath !== null) {
      // Chain of reassignments found
      return [{ requestId: currentReqId, assetId: laptop.id }, ...subPath];
    }
  }

  return null;
}

/**
 * Recommended policy:
 * "Serve most requests"
 * Maximum-cardinality bipartite matching with queue order lexicographical preference.
 * Uses deterministic augmenting-path search.
 */
export function computeRecommendedAllocation(
  requests: LoanRequest[],
  laptops: LaptopAsset[],
  baselineResult?: AllocationResult
): AllocationResult {
  const sortedReqs = sortRequests(requests);
  const sortedLaptops = sortLaptops(laptops);

  const reqMap = new Map<string, LoanRequest>(
    sortedReqs.map((r) => [r.id, r])
  );

  const matchR = new Map<string, string>(); // requestId -> assetId
  const matchL = new Map<string, string>(); // assetId -> requestId

  for (const req of sortedReqs) {
    const visitedAssets = new Set<string>();
    const path = findAugmentingPath(
      req.id,
      visitedAssets,
      reqMap,
      sortedLaptops,
      matchL
    );

    if (path !== null) {
      // Apply reassignments along the augmenting path
      for (const step of path) {
        matchR.set(step.requestId, step.assetId);
        matchL.set(step.assetId, step.requestId);
      }
    }
    // If path is null, existing matches are preserved
  }

  const assignments: Record<string, string> = {};
  const reverseAssignments: Record<string, string> = {};

  for (const [rId, aId] of matchR.entries()) {
    assignments[rId] = aId;
  }
  for (const [aId, rId] of matchL.entries()) {
    reverseAssignments[aId] = rId;
  }

  // Calculate changes compared to baseline
  const baselineAssignments = baselineResult?.assignments || {};
  const outcomes: AssignmentOutcome[] = sortedReqs.map((req) => {
    const assetId = assignments[req.id] || null;
    const baseAssetId = baselineAssignments[req.id] || null;
    const isMatched = assetId !== null;
    const isChangedFromBaseline = assetId !== baseAssetId;

    return {
      requestId: req.id,
      assetId,
      isMatched,
      isChangedFromBaseline,
    };
  });

  return {
    policyId: 'recommended',
    policyName: 'Serve most requests',
    policyDescription:
      'Optimized matching: finds maximum compatible assignments while respecting queue priority via deterministic augmenting paths.',
    assignments,
    reverseAssignments,
    outcomes,
    servedCount: Object.keys(assignments).length,
    totalRequests: sortedReqs.length,
  };
}

/**
 * Computes both policies together, ensuring baseline comparisons are always consistent.
 */
export function computeBothAllocations(
  requests: LoanRequest[],
  laptops: LaptopAsset[]
): {
  baseline: AllocationResult;
  recommended: AllocationResult;
} {
  const baseline = computeBaselineAllocation(requests, laptops);
  const recommended = computeRecommendedAllocation(requests, laptops, baseline);
  return { baseline, recommended };
}
