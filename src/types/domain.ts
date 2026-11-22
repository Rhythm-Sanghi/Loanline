export type RamGb = 4 | 8 | 16 | 32;
export type YesNo = 'yes' | 'no';
export type LaptopStatus = 'Ready' | 'Repair' | 'Held';

export interface LoanRequest {
  id: string; // Unique stable ID (e.g., 'Q-01')
  queueTimestamp: string; // ISO UTC string (e.g., '2026-11-20T09:00:00Z')
  allowedDesks: string[]; // e.g. ['North'] or ['North', 'South']
  minRamGb: RamGb;
  batteryRequired: boolean; // portable battery verification required
}

export interface LaptopAsset {
  id: string; // Unique stable asset ID (e.g., 'LT-01')
  pickupDesk: string;
  ramGb: RamGb;
  chargerVerified: YesNo;
  batteryVerified: YesNo;
  status: LaptopStatus;
}

export type IncompatibilityReasonCode =
  | 'STATUS_NOT_READY'
  | 'CHARGER_UNVERIFIED'
  | 'DESK_MISMATCH'
  | 'INSUFFICIENT_RAM'
  | 'BATTERY_UNVERIFIED';

export interface IncompatibilityReason {
  code: IncompatibilityReasonCode;
  label: string;
  detail: string;
}

export interface CompatibilityCheck {
  isCompatible: boolean;
  reasons: IncompatibilityReason[];
}

export type PolicyId = 'baseline' | 'recommended';

export interface AssignmentOutcome {
  requestId: string;
  assetId: string | null;
  isMatched: boolean;
  isChangedFromBaseline: boolean;
}

export interface AllocationResult {
  policyId: PolicyId;
  policyName: string;
  policyDescription: string;
  assignments: Record<string, string>; // requestId -> assetId
  reverseAssignments: Record<string, string>; // assetId -> requestId
  outcomes: AssignmentOutcome[];
  servedCount: number;
  totalRequests: number;
}

export interface CandidateEvaluation {
  asset: LaptopAsset;
  isCompatible: boolean;
  reasons: IncompatibilityReason[];
  assignedToRequestId: string | null;
}

export interface RequestExplanation {
  requestId: string;
  isMatched: boolean;
  assignedAssetId: string | null;
  baselineAssetId: string | null;
  isChangedFromBaseline: boolean;
  statusCode: 'MATCHED_SAME' | 'MATCHED_REASSIGNED' | 'MATCHED_NEW' | 'WAITING_NO_COMPATIBLE' | 'WAITING_COMPETITION' | 'WAITING_MULTI_CONSTRAINT';
  headline: string;
  summary: string;
  candidateEvaluations: CandidateEvaluation[];
  blockingReasons: string[];
}

export interface RepairPreview {
  targetAssetId: string;
  originalStatus: LaptopStatus;
  previewStatus: LaptopStatus;
  beforeServedCount: number;
  afterServedCount: number;
  newlyServedRequestIds: string[];
  remainingWaitingRequestIds: string[];
  changedPairings: Array<{
    requestId: string;
    fromAssetId: string | null;
    toAssetId: string | null;
  }>;
  remainingBlockers: string[];
}

export interface WorkspaceData {
  version: number;
  requests: LoanRequest[];
  laptops: LaptopAsset[];
  updatedAt: string;
}
