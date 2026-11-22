import React from 'react';
import { AllocationResult, PolicyId } from '../types/domain';

interface PolicyComparisonProps {
  baselineResult: AllocationResult;
  recommendedResult: AllocationResult;
  selectedPolicy: PolicyId;
  onSelectPolicy: (policy: PolicyId) => void;
}

export const PolicyComparison: React.FC<PolicyComparisonProps> = ({
  baselineResult,
  recommendedResult,
  selectedPolicy,
  onSelectPolicy,
}) => {
  const diffCount = recommendedResult.servedCount - baselineResult.servedCount;

  return (
    <section className="policy-cards-grid" aria-label="Policy Comparison">
      {/* Baseline Policy Card */}
      <button
        type="button"
        className={`policy-card ${selectedPolicy === 'baseline' ? 'active' : ''}`}
        onClick={() => onSelectPolicy('baseline')}
        aria-pressed={selectedPolicy === 'baseline'}
      >
        <div className="policy-card-header">
          <span className="policy-title">Queue order · first compatible laptop</span>
          <span className="policy-badge">Baseline Heuristic</span>
        </div>
        <div className="policy-metric">
          {baselineResult.servedCount} of {baselineResult.totalRequests}
        </div>
        <p className="policy-desc">
          Reference heuristic: requests in queue order greedily take the first free compatible device in ASCII inventory order without reallocating earlier pairs.
        </p>
      </button>

      {/* Recommended Policy Card */}
      <button
        type="button"
        className={`policy-card ${selectedPolicy === 'recommended' ? 'active' : ''}`}
        onClick={() => onSelectPolicy('recommended')}
        aria-pressed={selectedPolicy === 'recommended'}
      >
        <div className="policy-card-header">
          <span className="policy-title">Serve most requests</span>
          <span className="policy-badge">Recommended</span>
        </div>
        <div className="policy-metric">
          {recommendedResult.servedCount} of {recommendedResult.totalRequests}
          {diffCount > 0 && (
            <span className="policy-metric-diff">
              +{diffCount} more on same stock
            </span>
          )}
        </div>
        <p className="policy-desc">
          Augmenting-path bipartite matching: maximizes total compatible loans while respecting queue priority by reallocating earlier flexible borrowers.
        </p>
      </button>
    </section>
  );
};
