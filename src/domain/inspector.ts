import {
  LoanRequest,
  LaptopAsset,
  AllocationResult,
  RequestExplanation,
  CandidateEvaluation,
  RepairPreview,
} from '../types/domain';
import { checkCompatibility } from './compatibility';
import { computeRecommendedAllocation } from './allocator';

/**
 * Generates structured explanation for a given request under the selected policy.
 */
export function explainRequest(
  request: LoanRequest,
  laptops: LaptopAsset[],
  currentResult: AllocationResult,
  baselineResult: AllocationResult
): RequestExplanation {
  const currentAssetId = currentResult.assignments[request.id] || null;
  const baselineAssetId = baselineResult.assignments[request.id] || null;
  const isMatched = currentAssetId !== null;
  const isChangedFromBaseline = currentAssetId !== baselineAssetId;

  // Evaluate every laptop against this request
  const candidateEvaluations: CandidateEvaluation[] = laptops.map((laptop) => {
    const check = checkCompatibility(request, laptop);
    const assignedTo = currentResult.reverseAssignments[laptop.id] || null;
    return {
      asset: laptop,
      isCompatible: check.isCompatible,
      reasons: check.reasons,
      assignedToRequestId: assignedTo,
    };
  });

  const compatibleCandidates = candidateEvaluations.filter((c) => c.isCompatible);
  const blockingReasons: string[] = [];
  const netGain = currentResult.servedCount - baselineResult.servedCount;

  let statusCode: RequestExplanation['statusCode'];
  let headline = '';
  let summary = '';

  if (isMatched) {
    if (baselineAssetId === null) {
      statusCode = 'MATCHED_NEW';
      headline = 'Assigned under recommended policy';
      if (netGain > 0) {
        summary = `Previously waiting under queue baseline. In the recommended policy, this request is assigned to ${currentAssetId}, contributing to a batch increase of ${netGain} more compatible proposal${netGain === 1 ? '' : 's'}.`;
      } else {
        summary = `Previously waiting under queue baseline. In the recommended policy, this request is assigned to ${currentAssetId}.`;
      }
    } else if (isChangedFromBaseline) {
      statusCode = 'MATCHED_REASSIGNED';
      headline = 'Reassigned under recommended policy';
      if (netGain > 0) {
        summary = `In baseline, this request received ${baselineAssetId}. Reassigned to ${currentAssetId} to free a scarce configuration for another request, contributing to ${netGain} more compatible proposal${netGain === 1 ? '' : 's'} across the batch.`;
      } else {
        summary = `In baseline, this request received ${baselineAssetId}. Reassigned to ${currentAssetId} as an alternative compatible assignment (both policies propose ${currentResult.servedCount} assignments).`;
      }
    } else {
      statusCode = 'MATCHED_SAME';
      headline = 'Assigned compatible laptop';
      summary = `Assigned to ${currentAssetId}. Compatible with ${request.minRamGb} GB minimum RAM requirement at ${request.allowedDesks.join(', ')} desk.`;
    }
  } else {
    // Request is waiting
    if (compatibleCandidates.length === 0) {
      statusCode = 'WAITING_NO_COMPATIBLE';
      headline = 'No compatible laptop';

      // Check specific blockers across inventory
      const deskMatches = laptops.filter((l) => request.allowedDesks.includes(l.pickupDesk));
      if (deskMatches.length === 0) {
        blockingReasons.push(`No laptops currently located at requested desk (${request.allowedDesks.join(', ')}).`);
      } else {
        const readyDesks = deskMatches.filter((l) => l.status === 'Ready' && l.chargerVerified === 'yes');
        if (readyDesks.length === 0) {
          blockingReasons.push(`Laptops exist at ${request.allowedDesks.join(', ')} desk, but none are currently Ready with verified chargers.`);
        }
        if (request.batteryRequired) {
          const batteryReady = readyDesks.filter((l) => l.batteryVerified === 'yes');
          if (batteryReady.length === 0) {
            blockingReasons.push('Request requires verified portable battery, but no ready laptop at this desk has battery verified.');
          }
        }
        const ramMatches = readyDesks.filter((l) => l.ramGb >= request.minRamGb);
        if (ramMatches.length === 0 && deskMatches.length > 0) {
          blockingReasons.push(`No ready laptops at ${request.allowedDesks.join(', ')} desk meet the ${request.minRamGb} GB RAM minimum.`);
        }
      }

      summary = blockingReasons.length > 0
        ? blockingReasons.join(' ')
        : 'Zero laptops in inventory meet all operational and technical requirements.';
    } else {
      // Compatible laptops exist, but all are occupied
      statusCode = 'WAITING_COMPETITION';
      headline = 'Compatible laptops already assigned';
      const occupiedBy = compatibleCandidates
        .map((c) => `${c.asset.id} (held by ${c.assignedToRequestId || 'unknown'})`)
        .join(', ');
      summary = `Compatible devices (${occupiedBy}) are already assigned to earlier or higher-priority requests under this policy.`;
      blockingReasons.push(`All ${compatibleCandidates.length} compatible device(s) are actively assigned.`);
    }
  }

  return {
    requestId: request.id,
    isMatched,
    assignedAssetId: currentAssetId,
    baselineAssetId,
    isChangedFromBaseline,
    statusCode,
    headline,
    summary,
    candidateEvaluations,
    blockingReasons,
  };
}

/**
 * Simulates changing one Repair laptop to Ready status and recomputes the recommendation.
 * Returns null if the target laptop is not found or not in Repair status.
 */
export function simulateRepairPreview(
  targetAssetId: string,
  requests: LoanRequest[],
  laptops: LaptopAsset[],
  currentResult: AllocationResult
): RepairPreview | null {
  const targetIndex = laptops.findIndex((l) => l.id === targetAssetId);
  if (targetIndex === -1) return null;

  const originalLaptop = laptops[targetIndex];
  if (originalLaptop.status !== 'Repair') {
    return null;
  }

  // Deep copy laptops and mutate the single target laptop to 'Ready'
  const modifiedLaptops: LaptopAsset[] = laptops.map((l) =>
    l.id === targetAssetId ? { ...l, status: 'Ready' } : { ...l }
  );

  const previewAllocation = computeRecommendedAllocation(requests, modifiedLaptops);

  // Compare results
  const newlyServedRequestIds: string[] = [];
  const remainingWaitingRequestIds: string[] = [];
  const changedPairings: RepairPreview['changedPairings'] = [];

  for (const req of requests) {
    const beforeAsset = currentResult.assignments[req.id] || null;
    const afterAsset = previewAllocation.assignments[req.id] || null;

    if (beforeAsset === null && afterAsset !== null) {
      newlyServedRequestIds.push(req.id);
    } else if (afterAsset === null) {
      remainingWaitingRequestIds.push(req.id);
    }

    if (beforeAsset !== afterAsset) {
      changedPairings.push({
        requestId: req.id,
        fromAssetId: beforeAsset,
        toAssetId: afterAsset,
      });
    }
  }

  // Check if any remaining blockers exist for the newly previewed laptop itself
  const remainingBlockers: string[] = [];
  if (originalLaptop.chargerVerified !== 'yes') {
    remainingBlockers.push('Charger verification is still recorded as "no" (unverified).');
  }

  return {
    targetAssetId,
    originalStatus: originalLaptop.status,
    previewStatus: 'Ready',
    beforeServedCount: currentResult.servedCount,
    afterServedCount: previewAllocation.servedCount,
    newlyServedRequestIds,
    remainingWaitingRequestIds,
    changedPairings,
    remainingBlockers,
  };
}

/**
 * Validates whether the specific Q-02 "Reveal" worked example facts hold in the current state.
 * Returns true only when:
 * 1. Q-02 requires >= 16 GB RAM.
 * 2. LT-01 is Ready, has verified charger, and has >= Q-02's required RAM.
 * 3. LT-02 is Ready and verified.
 * 4. In baseline, Q-01 held LT-01 while Q-02 was left unserved.
 * 5. In recommended, Q-01 is reassigned to LT-02 and Q-02 is served with LT-01.
 */
export function isSampleRevealApplicable(
  selectedRequest: LoanRequest,
  laptops: LaptopAsset[],
  explanation: RequestExplanation,
  baselineResult: AllocationResult,
  currentResult: AllocationResult
): boolean {
  if (selectedRequest.id !== 'Q-02') return false;
  if (selectedRequest.minRamGb < 16) return false;

  const lt01 = laptops.find((l) => l.id === 'LT-01');
  const lt02 = laptops.find((l) => l.id === 'LT-02');

  if (!lt01 || lt01.status !== 'Ready' || lt01.chargerVerified !== 'yes') return false;
  if (lt01.ramGb < selectedRequest.minRamGb) return false;

  if (!lt02 || lt02.status !== 'Ready' || lt02.chargerVerified !== 'yes') return false;

  return (
    explanation.statusCode === 'MATCHED_NEW' &&
    explanation.assignedAssetId === 'LT-01' &&
    baselineResult.assignments['Q-01'] === 'LT-01' &&
    baselineResult.assignments['Q-02'] === undefined &&
    currentResult.assignments['Q-01'] === 'LT-02' &&
    currentResult.assignments['Q-02'] === 'LT-01'
  );
}
