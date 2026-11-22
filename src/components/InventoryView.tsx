import React, { useState } from 'react';
import { LaptopAsset, RamGb, YesNo, LaptopStatus } from '../types/domain';

interface InventoryViewProps {
  laptops: LaptopAsset[];
  onAddLaptop: (laptop: LaptopAsset) => { success: boolean; error?: string };
  onUpdateLaptop: (laptop: LaptopAsset) => { success: boolean; error?: string };
  onDeleteLaptop: (id: string) => void;
  onTriggerPreview: (assetId: string) => void;
  highlightedAssetId?: string | null;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  laptops,
  onAddLaptop,
  onUpdateLaptop,
  onDeleteLaptop,
  onTriggerPreview,
  highlightedAssetId,
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formDesk, setFormDesk] = useState('North');
  const [formRam, setFormRam] = useState<RamGb>(8);
  const [formCharger, setFormCharger] = useState<YesNo>('yes');
  const [formBattery, setFormBattery] = useState<YesNo>('yes');
  const [formStatus, setFormStatus] = useState<LaptopStatus>('Ready');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormId('');
    setFormDesk('North');
    setFormRam(8);
    setFormCharger('yes');
    setFormBattery('yes');
    setFormStatus('Ready');
    setFormError(null);
    setIsEditing(null);
  };

  const handleStartEdit = (laptop: LaptopAsset) => {
    setIsEditing(laptop.id);
    setFormId(laptop.id);
    setFormDesk(laptop.pickupDesk);
    setFormRam(laptop.ramGb);
    setFormCharger(laptop.chargerVerified);
    setFormBattery(laptop.batteryVerified);
    setFormStatus(laptop.status);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedId = formId.trim();
    if (!trimmedId) {
      setFormError('Asset ID is required (e.g. LT-05).');
      return;
    }

    const newLaptop: LaptopAsset = {
      id: trimmedId,
      pickupDesk: formDesk,
      ramGb: formRam,
      chargerVerified: formCharger,
      batteryVerified: formBattery,
      status: formStatus,
    };

    if (isEditing) {
      const res = onUpdateLaptop(newLaptop);
      if (!res.success) {
        setFormError(res.error || 'Failed to update laptop.');
      } else {
        resetForm();
      }
    } else {
      const res = onAddLaptop(newLaptop);
      if (!res.success) {
        setFormError(res.error || 'Failed to add laptop.');
      } else {
        resetForm();
      }
    }
  };

  return (
    <div className="content-work-area">
      <section className="panel" aria-label="Inventory Management">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              Refurbished Laptop Inventory
              <span className="badge badge-mono">{laptops.length} Assets</span>
            </h2>
            <p className="panel-subtitle">
              Charger and battery verification are recorded separately from readiness status.
            </p>
          </div>
        </div>

        {/* Inline Add / Edit Form */}
        <form className="form-panel" onSubmit={handleSubmit}>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '8px' }}>
            {isEditing ? `Edit Asset ${isEditing}` : 'Register New Asset'}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="lap-id">Asset ID</label>
              <input
                id="lap-id"
                type="text"
                className="form-control mono-val"
                placeholder="e.g. LT-05"
                value={formId}
                disabled={Boolean(isEditing)}
                onChange={(e) => setFormId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lap-desk">Pickup Desk</label>
              <select
                id="lap-desk"
                className="form-control"
                value={formDesk}
                onChange={(e) => setFormDesk(e.target.value)}
              >
                <option value="North">North</option>
                <option value="South">South</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="lap-ram">RAM</label>
              <select
                id="lap-ram"
                className="form-control"
                value={formRam}
                onChange={(e) => setFormRam(Number(e.target.value) as RamGb)}
              >
                <option value={4}>4 GB</option>
                <option value={8}>8 GB</option>
                <option value={16}>16 GB</option>
                <option value={32}>32 GB</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="lap-charger">Charger Verified</label>
              <select
                id="lap-charger"
                className="form-control"
                value={formCharger}
                onChange={(e) => setFormCharger(e.target.value as YesNo)}
              >
                <option value="yes">Yes (Verified)</option>
                <option value="no">No (Unverified)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="lap-battery">Battery Verified</label>
              <select
                id="lap-battery"
                className="form-control"
                value={formBattery}
                onChange={(e) => setFormBattery(e.target.value as YesNo)}
              >
                <option value="yes">Yes (Verified)</option>
                <option value="no">No (Unverified)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="lap-status">Readiness Status</label>
              <select
                id="lap-status"
                className="form-control"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as LaptopStatus)}
              >
                <option value="Ready">Ready</option>
                <option value="Repair">Repair</option>
                <option value="Held">Held</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">
                {isEditing ? 'Save edits' : 'Add asset'}
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

        {/* Inventory Table */}
        <div className="table-container">
          <table className="data-table" aria-label="Inventory table">
            <thead>
              <tr>
                <th scope="col">Asset ID</th>
                <th scope="col">Pickup Desk</th>
                <th scope="col">RAM</th>
                <th scope="col">Charger Verified</th>
                <th scope="col">Battery Verified</th>
                <th scope="col">Readiness Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {laptops.map((laptop) => {
                const isHighlighted = laptop.id === highlightedAssetId;

                return (
                  <tr
                    key={laptop.id}
                    className={isHighlighted ? 'selected' : ''}
                  >
                    <td className="mono-val" style={{ fontWeight: 600 }}>
                      {laptop.id}
                    </td>
                    <td>{laptop.pickupDesk}</td>
                    <td>{laptop.ramGb} GB</td>
                    <td>
                      <span className={`badge ${laptop.chargerVerified === 'yes' ? 'badge-ready' : 'badge-error'}`}>
                        {laptop.chargerVerified === 'yes' ? 'Verified Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${laptop.batteryVerified === 'yes' ? 'badge-ready' : 'badge-held'}`}>
                        {laptop.batteryVerified === 'yes' ? 'Verified Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          laptop.status === 'Ready'
                            ? 'badge-ready'
                            : laptop.status === 'Repair'
                            ? 'badge-repair'
                            : 'badge-held'
                        }`}
                      >
                        {laptop.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {laptop.status === 'Repair' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-warning"
                            onClick={() => onTriggerPreview(laptop.id)}
                            title="Preview impact if this repair is completed"
                          >
                            What if? Preview
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleStartEdit(laptop)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onDeleteLaptop(laptop.id)}
                          style={{ color: 'var(--status-error-text)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
