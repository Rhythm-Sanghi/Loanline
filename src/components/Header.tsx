import React from 'react';
import { PolicyId, LaptopAsset } from '../types/domain';

interface HeaderProps {
  activeTab: 'plan' | 'requests' | 'inventory';
  onSelectTab: (tab: 'plan' | 'requests' | 'inventory') => void;
  isModifiedFromSample: boolean;
  repairLaptops: LaptopAsset[];
  onTriggerPreview: (assetId: string) => void;
  onPrint: () => void;
  onOpenResetConfirm: () => void;
  selectedPolicy: PolicyId;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isModifiedFromSample,
  repairLaptops,
  onTriggerPreview,
  onPrint,
  onOpenResetConfirm,
}) => {
  const repairCandidate = repairLaptops.length > 0 ? repairLaptops[0] : null;

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-section">
          <h1 className="brand-title">LOANLINE</h1>
          <span className="brand-badge" title="Workspace data is stored locally in this browser profile">
            {isModifiedFromSample ? 'Modified workspace' : 'Sample workspace'}
          </span>
          <span className="brand-tagline">
            Campus Laptop Allocation &amp; Stock Preview
          </span>
        </div>

        <div className="header-actions">
          {repairCandidate && (
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => onTriggerPreview(repairCandidate.id)}
              title={`Simulate repair of ${repairCandidate.id}`}
            >
              What if? Preview {repairCandidate.id}
            </button>
          )}

          <button
            type="button"
            className="btn"
            onClick={onPrint}
            title="Print current proposed allocation plan to paper or PDF"
          >
            Print plan
          </button>

          <button
            type="button"
            className="btn"
            onClick={onOpenResetConfirm}
            title="Restore default sample fixture"
          >
            Reset sample
          </button>
        </div>
      </div>

      <nav className="header-nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-tab ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => onSelectTab('plan')}
          aria-current={activeTab === 'plan' ? 'page' : undefined}
        >
          Plan &amp; Allocation
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => onSelectTab('requests')}
          aria-current={activeTab === 'requests' ? 'page' : undefined}
        >
          Requests
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => onSelectTab('inventory')}
          aria-current={activeTab === 'inventory' ? 'page' : undefined}
        >
          Inventory
        </button>
      </nav>
    </header>
  );
};
