import React from 'react';
import { RepairPreview } from '../types/domain';

interface RepairPreviewDrawerProps {
  preview: RepairPreview | null;
  onClose: () => void;
}

export const RepairPreviewDrawer: React.FC<RepairPreviewDrawerProps> = ({
  preview,
  onClose,
}) => {
  if (!preview) return null;

  const diff = preview.afterServedCount - preview.beforeServedCount;

  return (
    <div
      className="notification-banner banner-preview no-print"
      role="region"
      aria-label="Repair simulation preview banner"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '12px 24px',
        borderBottom: '2px solid var(--status-repair-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="badge badge-repair"
            style={{ fontWeight: 700, letterSpacing: '0.04em' }}
          >
            PREVIEW ONLY
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            Simulating {preview.targetAssetId} ({preview.originalStatus} → Ready)
          </span>
        </div>

        <button
          type="button"
          className="btn btn-sm"
          onClick={onClose}
          aria-label="Close repair preview"
        >
          ✕ Close preview
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: '0.8125rem',
        }}
      >
        <div>
          <strong>Impact:</strong>{' '}
          {preview.beforeServedCount} served →{' '}
          <span style={{ fontWeight: 700, color: 'var(--status-ready-text)' }}>
            {preview.afterServedCount} served
          </span>{' '}
          ({diff >= 0 ? `+${diff}` : diff} loans)
        </div>

        {preview.newlyServedRequestIds.length > 0 && (
          <div>
            <strong>Newly served:</strong>{' '}
            {preview.newlyServedRequestIds.map((id) => (
              <span key={id} className="badge badge-ready mono-val" style={{ marginLeft: '4px' }}>
                {id}
              </span>
            ))}
          </div>
        )}

        {preview.remainingWaitingRequestIds.length > 0 && (
          <div>
            <strong>Still waiting:</strong>{' '}
            {preview.remainingWaitingRequestIds.join(', ')}
          </div>
        )}

        {preview.remainingBlockers.length > 0 && (
          <div style={{ color: 'var(--status-error-text)', fontWeight: 600 }}>
            Remaining blocker: {preview.remainingBlockers.join('; ')}
          </div>
        )}

        {preview.changedPairings.length > 0 && (
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
            Pairings updated:{' '}
            {preview.changedPairings
              .map((p) => `${p.requestId} (${p.fromAssetId || 'wait'} → ${p.toAssetId})`)
              .join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};
