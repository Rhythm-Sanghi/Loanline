import React, { useEffect } from 'react';
import {
  LoanRequest,
  LaptopAsset,
  AllocationResult,
  PolicyId,
} from '../types/domain';
import { PolicyComparison } from './PolicyComparison';

interface PlanViewProps {
  requests: LoanRequest[];
  laptops: LaptopAsset[];
  baselineResult: AllocationResult;
  recommendedResult: AllocationResult;
  selectedPolicy: PolicyId;
  onSelectPolicy: (policy: PolicyId) => void;
  selectedRequestId: string | null;
  onSelectRequest: (requestId: string) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  requests,
  laptops,
  baselineResult,
  recommendedResult,
  selectedPolicy,
  onSelectPolicy,
  selectedRequestId,
  onSelectRequest,
}) => {
  const activeResult =
    selectedPolicy === 'recommended' ? recommendedResult : baselineResult;

  // Keyboard navigation up and down rows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (requests.length === 0) return;

      const currentIndex = requests.findIndex((r) => r.id === selectedRequestId);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < requests.length - 1 ? currentIndex + 1 : 0;
        onSelectRequest(requests[nextIndex].id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : requests.length - 1;
        onSelectRequest(requests[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requests, selectedRequestId, onSelectRequest]);

  return (
    <div className="content-work-area">
      {/* Printable Header (Visible only when printed) */}
      <div className="print-header">
        <h1>Campus Laptop Lending Program · Allocation Proposal</h1>
        <p>
          Generated for coordinator review · Modeled with two pickup desks (North, South)
        </p>
        <p>
          <strong>Selected Policy:</strong> {activeResult.policyName} ({activeResult.servedCount} of {activeResult.totalRequests} requests served)
        </p>
        <span className="print-disclaimer">
          Proposed assignment for review · Subject to physical asset check
        </span>
      </div>

      {/* Policy Comparison Component */}
      <PolicyComparison
        baselineResult={baselineResult}
        recommendedResult={recommendedResult}
        selectedPolicy={selectedPolicy}
        onSelectPolicy={onSelectPolicy}
      />

      {/* Main Allocation Table Panel */}
      <section className="panel" aria-label="Allocation Table">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              Batch Requests &amp; Proposed Assignments
              <span className="badge badge-mono">
                {activeResult.servedCount} / {requests.length} Assigned
              </span>
            </h2>
            <p className="panel-subtitle">
              Use arrow keys or click to inspect constraints and compatibility evidence.
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table" role="grid" aria-label="Lending desk batch allocation">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Request ID</th>
                <th scope="col">Queue UTC</th>
                <th scope="col">Allowed Desks</th>
                <th scope="col">Min RAM</th>
                <th scope="col">Battery Req</th>
                <th scope="col">Assigned Device</th>
                <th scope="col">Device Specs</th>
                <th scope="col">Policy Change</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                    No requests recorded in the current batch. Add requests in the Requests tab.
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => {
                  const assignedAssetId = activeResult.assignments[req.id] || null;
                  const isSelected = req.id === selectedRequestId;
                  const baselineAssetId = baselineResult.assignments[req.id] || null;
                  const isChanged =
                    selectedPolicy === 'recommended' &&
                    assignedAssetId !== baselineAssetId;

                  const assignedLaptop = assignedAssetId
                    ? laptops.find((l) => l.id === assignedAssetId)
                    : null;

                  return (
                    <tr
                      key={req.id}
                      onClick={() => onSelectRequest(req.id)}
                      className={`${isSelected ? 'selected' : ''} ${isChanged ? 'table-row-changed' : ''}`}
                      role="row"
                      aria-selected={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectRequest(req.id);
                        }
                      }}
                    >
                      <td>
                        {assignedAssetId ? (
                          <span className="badge badge-matched">Matched</span>
                        ) : (
                          <span className="badge badge-waiting">Waiting</span>
                        )}
                      </td>
                      <td className="mono-val" style={{ fontWeight: 600 }}>
                        {req.id}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        #{idx + 1} ({req.queueTimestamp.replace('T', ' ').replace('Z', ' UTC')})
                      </td>
                      <td>{req.allowedDesks.join(', ')}</td>
                      <td>{req.minRamGb} GB</td>
                      <td>{req.batteryRequired ? 'Yes (Verified)' : 'No'}</td>
                      <td className="mono-val" style={{ fontWeight: 600 }}>
                        {assignedAssetId || '—'}
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>
                        {assignedLaptop
                          ? `${assignedLaptop.ramGb} GB · ${assignedLaptop.pickupDesk}`
                          : '—'}
                      </td>
                      <td>
                        {isChanged ? (
                          <span className="badge badge-changed">
                            {baselineAssetId === null ? 'Newly served' : `Reassigned (${baselineAssetId})`}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                            Unchanged
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
