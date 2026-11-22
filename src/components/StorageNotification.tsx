import React from 'react';
import { StorageLoadStatus } from '../storage/storage';

interface StorageNotificationProps {
  status: StorageLoadStatus;
  errorMessage?: string;
  onDismiss: () => void;
  onReset: () => void;
}

export const StorageNotification: React.FC<StorageNotificationProps> = ({
  status,
  errorMessage,
  onDismiss,
  onReset,
}) => {
  if (status === 'OK' || status === 'DEFAULT') return null;

  return (
    <div className="notification-banner banner-warning no-print" role="alert">
      <div>
        <strong>Storage Notice ({status}):</strong>{' '}
        {errorMessage || 'Workspace storage encountered an issue.'}{' '}
        <span>Changes will remain active in memory.</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={onReset}
        >
          Reset to Sample
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
