import React from 'react';
import {
  LoanRequest,
  LaptopAsset,
  AllocationResult,
} from '../types/domain';
import { explainRequest } from '../domain/inspector';

interface InspectorProps {
  selectedRequest: LoanRequest | null;
  laptops: LaptopAsset[];
  currentResult: AllocationResult;
  baselineResult: AllocationResult;
  onNavigateToInventory?: (assetId: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedRequest,
  laptops,
  currentResult,
  baselineResult,
  onNavigateToInventory,
}) => {
  if (!selectedRequest) {
    return (
      <aside className="inspector-panel" aria-label="Evidence Inspector">
        <div className="inspector-card">
          <div className="inspector-header">
            <span className="inspector-label">Evidence Inspector</span>
            <h3 className="inspector-headline">No Request Selected</h3>
          </div>
          <p className="inspector-summary-box">
            Select any request row in the plan table to inspect constraints, candidate inventory, and allocation decisions.
          </p>
        </div>
      </aside>
    );
  }

  const explanation = explainRequest(
    selectedRequest,
    laptops,
    currentResult,
    baselineResult
  );

  const assignedLaptop = explanation.assignedAssetId
    ? laptops.find((l) => l.id === explanation.assignedAssetId)
    : null;

  // The sample reveal callout applies ONLY when the exact sample conditions actively hold in this snapshot:
  // Q-02 requires 16 GB, was waiting in baseline, and is now matched to LT-01 because Q-01 shifted to LT-02.
  // If Q-02's RAM requirement, LT-01's readiness, or assignments are edited, this callout automatically disappears.
  const isSampleRevealApplicable =
    selectedRequest.id === 'Q-02' &&
    selectedRequest.minRamGb === 16 &&
    explanation.statusCode === 'MATCHED_NEW' &&
    explanation.assignedAssetId === 'LT-01' &&
    baselineResult.assignments['Q-01'] === 'LT-01' &&
    currentResult.assignments['Q-01'] === 'LT-02';

  return (
    <aside className="inspector-panel" aria-label={`Evidence Inspector for ${selectedRequest.id}`}>
      <div className="inspector-card">
        {/* Header */}
        <div className="inspector-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="inspector-label">Evidence Inspector</span>
            <span className="mono-val" style={{ fontWeight: 700 }}>
              {selectedRequest.id}
            </span>
          </div>
          <h3 className="inspector-headline">{explanation.headline}</h3>
        </div>

        {/* Status & Change Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {explanation.isMatched ? (
            <span className="badge badge-matched">
              Matched: {explanation.assignedAssetId}
            </span>
          ) : (
            <span className="badge badge-waiting">Waiting in Queue</span>
          )}

          {explanation.isChangedFromBaseline && (
            <span className="badge badge-changed">
              {explanation.baselineAssetId === null ? 'Newly Served' : 'Reassigned'}
            </span>
          )}
        </div>

        {/* First-Screen Callout for Q-02 (Only visible when sample reveal conditions actively hold) */}
        {isSampleRevealApplicable && (
          <div
            className="reveal-callout"
            style={{
              backgroundColor: 'var(--color-olive-subtle)',
              border: '1px solid var(--color-olive-border)',
              borderRadius: '4px',
              padding: '8px 10px',
              fontSize: '0.8125rem',
              color: 'var(--color-text-primary)',
              lineHeight: 1.4,
            }}
          >
            <strong>The Reveal:</strong> The oldest request (Q-01) can use either laptop. The next request (Q-02) needs 16 GB. Taking laptops in arrival order gives LT-01 (16 GB) to Q-01 and leaves Q-02 waiting. Loanline reassigns Q-01 to LT-02 (8 GB) and gives LT-01 to Q-02: <strong>one more compatible proposal on the same fictional stock</strong>.
          </div>
        )}

        {/* Narrative explanation */}
        <div className="inspector-section">
          <span className="inspector-label">Allocation Rationale</span>
          <div className="inspector-summary-box">
            {explanation.summary}
          </div>
        </div>

        {/* Reassignment Comparison if changed */}
        {explanation.isChangedFromBaseline && (
          <div className="inspector-section">
            <span className="inspector-label">Policy Comparison</span>
            <div
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--color-surface-sunken)',
                padding: '8px 10px',
                borderRadius: '4px',
                lineHeight: 1.4,
              }}
            >
              <div>
                <strong>Baseline assignment:</strong>{' '}
                <span className="mono-val">
                  {explanation.baselineAssetId || 'None (waiting)'}
                </span>
              </div>
              <div style={{ marginTop: '4px' }}>
                <strong>Recommended assignment:</strong>{' '}
                <span className="mono-val">
                  {explanation.assignedAssetId || 'None (waiting)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Request Constraints */}
        <div className="inspector-section">
          <span className="inspector-label">Recorded Constraints</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ background: 'var(--color-surface-sunken)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.6875rem' }}>PICKUP DESK</div>
              <div style={{ fontWeight: 600 }}>{selectedRequest.allowedDesks.join(', ')}</div>
            </div>
            <div style={{ background: 'var(--color-surface-sunken)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.6875rem' }}>MIN RAM</div>
              <div style={{ fontWeight: 600 }}>{selectedRequest.minRamGb} GB</div>
            </div>
            <div style={{ background: 'var(--color-surface-sunken)', padding: '6px 8px', borderRadius: '4px', gridColumn: 'span 2' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.6875rem' }}>PORTABLE BATTERY</div>
              <div style={{ fontWeight: 600 }}>
                {selectedRequest.batteryRequired ? 'Required (verified yes only)' : 'Not required'}
              </div>
            </div>
          </div>
        </div>

        {/* Matched device specifications if matched */}
        {assignedLaptop && (
          <div className="inspector-section">
            <span className="inspector-label">Assigned Device Specs</span>
            <div
              style={{
                fontSize: '0.75rem',
                border: '1px solid var(--color-olive-border)',
                borderRadius: '4px',
                padding: '8px 10px',
                background: 'var(--color-olive-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="mono-val" style={{ fontWeight: 700 }}>{assignedLaptop.id}</span>
                <span>{assignedLaptop.pickupDesk} Desk</span>
              </div>
              <div style={{ marginTop: '4px' }}>
                RAM: {assignedLaptop.ramGb} GB · Charger: {assignedLaptop.chargerVerified} · Battery: {assignedLaptop.batteryVerified}
              </div>
            </div>
          </div>
        )}

        {/* Candidate Stock Breakdown */}
        <div className="inspector-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="inspector-label">Inventory Candidate Evaluation</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
              {laptops.length} assets
            </span>
          </div>

          <div className="candidate-list">
            {explanation.candidateEvaluations.map((evalItem) => (
              <div
                key={evalItem.asset.id}
                className={`candidate-item ${evalItem.isCompatible ? 'compatible' : 'incompatible'}`}
              >
                <div className="candidate-row-top">
                  <span className="mono-val" style={{ fontWeight: 600 }}>
                    {evalItem.asset.id} ({evalItem.asset.ramGb}GB, {evalItem.asset.pickupDesk})
                  </span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>
                    {evalItem.isCompatible ? '✓ Compatible' : '✗ Ineligible'}
                  </span>
                </div>

                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                  Status: <strong>{evalItem.asset.status}</strong> · Charger: {evalItem.asset.chargerVerified} · Battery: {evalItem.asset.batteryVerified}
                </div>

                {evalItem.assignedToRequestId && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-primary)' }}>
                    Current occupant:{' '}
                    <span className="mono-val" style={{ fontWeight: 600 }}>
                      {evalItem.assignedToRequestId}
                    </span>
                  </div>
                )}

                {evalItem.reasons.length > 0 && (
                  <div>
                    {evalItem.reasons.map((r, i) => (
                      <span key={i} className="reason-tag">
                        {r.label}
                      </span>
                    ))}
                  </div>
                )}

                {onNavigateToInventory && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                    onClick={() => onNavigateToInventory(evalItem.asset.id)}
                  >
                    View in Inventory
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
