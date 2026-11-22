import React, { useState } from 'react';
import { LoanRequest, RamGb } from '../types/domain';

interface RequestsViewProps {
  requests: LoanRequest[];
  onAddRequest: (req: LoanRequest) => { success: boolean; error?: string };
  onUpdateRequest: (req: LoanRequest) => { success: boolean; error?: string };
  onDeleteRequest: (id: string) => void;
  onSelectRequestForInspector: (id: string) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  requests,
  onAddRequest,
  onUpdateRequest,
  onDeleteRequest,
  onSelectRequestForInspector,
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formTimestamp, setFormTimestamp] = useState(
    new Date().toISOString().slice(0, 16) + ':00Z'
  );
  const [formDesks, setFormDesks] = useState<string[]>(['North']);
  const [formMinRam, setFormMinRam] = useState<RamGb>(8);
  const [formBattery, setFormBattery] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormId('');
    setFormTimestamp(new Date().toISOString().slice(0, 16) + ':00Z');
    setFormDesks(['North']);
    setFormMinRam(8);
    setFormBattery(false);
    setFormError(null);
    setIsEditing(null);
  };

  const handleStartEdit = (req: LoanRequest) => {
    setIsEditing(req.id);
    setFormId(req.id);
    setFormTimestamp(req.queueTimestamp);
    setFormDesks([...req.allowedDesks]);
    setFormMinRam(req.minRamGb);
    setFormBattery(req.batteryRequired);
    setFormError(null);
  };

  const handleDeskToggle = (deskName: string) => {
    if (formDesks.includes(deskName)) {
      if (formDesks.length > 1) {
        setFormDesks(formDesks.filter((d) => d !== deskName));
      }
    } else {
      setFormDesks([...formDesks, deskName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedId = formId.trim();
    if (!trimmedId) {
      setFormError('Request ID is required (e.g. Q-05).');
      return;
    }

    if (isNaN(Date.parse(formTimestamp))) {
      setFormError('Valid ISO UTC timestamp required (e.g. 2026-11-20T10:00:00Z).');
      return;
    }

    if (formDesks.length === 0) {
      setFormError('At least one pickup desk must be selected.');
      return;
    }

    const newReq: LoanRequest = {
      id: trimmedId,
      queueTimestamp: formTimestamp,
      allowedDesks: formDesks,
      minRamGb: formMinRam,
      batteryRequired: formBattery,
    };

    if (isEditing) {
      const res = onUpdateRequest(newReq);
      if (!res.success) {
        setFormError(res.error || 'Failed to update request.');
      } else {
        resetForm();
      }
    } else {
      const res = onAddRequest(newReq);
      if (!res.success) {
        setFormError(res.error || 'Failed to add request.');
      } else {
        resetForm();
      }
    }
  };

  return (
    <div className="content-work-area">
      <section className="panel" aria-label="Requests Management">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              Fictional Loan Requests
              <span className="badge badge-mono">{requests.length} Total</span>
            </h2>
            <p className="panel-subtitle">
              Strict privacy model: names, emails, and personal identifiers are excluded by design.
            </p>
          </div>
        </div>

        {/* Inline Add / Edit Form */}
        <form className="form-panel" onSubmit={handleSubmit}>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '8px' }}>
            {isEditing ? `Edit Request ${isEditing}` : 'Add Fictional Request'}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="req-id">Request ID</label>
              <input
                id="req-id"
                type="text"
                className="form-control mono-val"
                placeholder="e.g. Q-05"
                value={formId}
                disabled={Boolean(isEditing)}
                onChange={(e) => setFormId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="req-time">Queue Timestamp (UTC)</label>
              <input
                id="req-time"
                type="text"
                className="form-control mono-val"
                placeholder="2026-11-20T10:00:00Z"
                value={formTimestamp}
                onChange={(e) => setFormTimestamp(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Allowed Desks</label>
              <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formDesks.includes('North')}
                    onChange={() => handleDeskToggle('North')}
                  />
                  North
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formDesks.includes('South')}
                    onChange={() => handleDeskToggle('South')}
                  />
                  South
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="req-ram">Minimum RAM</label>
              <select
                id="req-ram"
                className="form-control"
                value={formMinRam}
                onChange={(e) => setFormMinRam(Number(e.target.value) as RamGb)}
              >
                <option value={4}>4 GB</option>
                <option value={8}>8 GB</option>
                <option value={16}>16 GB</option>
                <option value={32}>32 GB</option>
              </select>
            </div>

            <div className="form-group">
              <label>Portable Battery</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', height: '32px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formBattery}
                  onChange={(e) => setFormBattery(e.target.checked)}
                />
                Require verified battery
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Save edits' : 'Add request'}
              </button>
              {isEditing && (
                <button type="button" className="btn" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {formError && (
            <div className="form-error-msg" style={{ marginTop: '8px' }}>
              {formError}
            </div>
          )}
        </form>

        {/* Requests Table */}
        <div className="table-container">
          <table className="data-table" aria-label="Requests table">
            <thead>
              <tr>
                <th scope="col">Stable ID</th>
                <th scope="col">Queue Timestamp (UTC)</th>
                <th scope="col">Allowed Desks</th>
                <th scope="col">Min RAM</th>
                <th scope="col">Battery Required</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="mono-val" style={{ fontWeight: 600 }}>
                    {req.id}
                  </td>
                  <td className="mono-val" style={{ fontSize: '0.75rem' }}>
                    {req.queueTimestamp}
                  </td>
                  <td>{req.allowedDesks.join(', ')}</td>
                  <td>{req.minRamGb} GB</td>
                  <td>{req.batteryRequired ? 'Yes' : 'No'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => handleStartEdit(req)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => onSelectRequestForInspector(req.id)}
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => onDeleteRequest(req.id)}
                        style={{ color: 'var(--status-error-text)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
