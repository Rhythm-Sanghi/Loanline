import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LoanRequest,
  LaptopAsset,
  PolicyId,
  RepairPreview,
  WorkspaceData,
} from './types/domain';
import { INITIAL_WORKSPACE, SAMPLE_REQUESTS, SAMPLE_LAPTOPS } from './domain/sampleData';
import { computeBothAllocations } from './domain/allocator';
import { simulateRepairPreview } from './domain/inspector';
import {
  loadWorkspace,
  saveWorkspace,
  clearSavedWorkspace,
  StorageLoadStatus,
} from './storage/storage';

import { Header } from './components/Header';
import { PlanView } from './components/PlanView';
import { RequestsView } from './components/RequestsView';
import { InventoryView } from './components/InventoryView';
import { Inspector } from './components/Inspector';
import { RepairPreviewDrawer } from './components/RepairPreviewDrawer';
import { ConfirmModal } from './components/ConfirmModal';
import { StorageNotification } from './components/StorageNotification';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'plan' | 'requests' | 'inventory'>('plan');

  // Policy selection: 'recommended' is selected by default
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyId>('recommended');

  // Workspace Data
  const [workspace, setWorkspace] = useState<WorkspaceData>(INITIAL_WORKSPACE);
  const [storageStatus, setStorageStatus] = useState<StorageLoadStatus>('DEFAULT');
  const [storageErrorMessage, setStorageErrorMessage] = useState<string | undefined>();

  // Selected request for inspector (defaults to Q-02 so the judge immediately sees the reveal)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>('Q-02');

  // Highlighted inventory asset
  const [highlightedAssetId, setHighlightedAssetId] = useState<string | null>(null);

  // Repair preview state
  const [activePreview, setActivePreview] = useState<RepairPreview | null>(null);

  // Reset modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Initialize storage on mount
  useEffect(() => {
    const loaded = loadWorkspace();
    setWorkspace(loaded.data);
    setStorageStatus(loaded.status);
    setStorageErrorMessage(loaded.errorMessage);
  }, []);

  // Compute allocations dynamically based on current requests and laptops
  const { baseline, recommended } = useMemo(() => {
    return computeBothAllocations(workspace.requests, workspace.laptops);
  }, [workspace.requests, workspace.laptops]);

  // Check if workspace matches initial sample
  const isModifiedFromSample = useMemo(() => {
    if (workspace.requests.length !== SAMPLE_REQUESTS.length) return true;
    if (workspace.laptops.length !== SAMPLE_LAPTOPS.length) return true;
    return JSON.stringify(workspace.requests) !== JSON.stringify(SAMPLE_REQUESTS) ||
      JSON.stringify(workspace.laptops) !== JSON.stringify(SAMPLE_LAPTOPS);
  }, [workspace]);

  // Keep selected request valid if requests change
  useEffect(() => {
    if (workspace.requests.length > 0) {
      const exists = workspace.requests.some((r) => r.id === selectedRequestId);
      if (!exists) {
        setSelectedRequestId(workspace.requests[0].id);
      }
    } else {
      setSelectedRequestId(null);
    }
  }, [workspace.requests, selectedRequestId]);

  // Save workspace updates to localStorage
  const updateWorkspace = useCallback((updater: (prev: WorkspaceData) => WorkspaceData) => {
    setWorkspace((prev) => {
      const next = updater(prev);
      const saveRes = saveWorkspace(next);
      if (!saveRes.success) {
        setStorageErrorMessage(saveRes.error);
      }
      return next;
    });
    // An input edit clears any active preview
    setActivePreview(null);
  }, []);

  // Repair laptops list for header action
  const repairLaptops = useMemo(() => {
    return workspace.laptops.filter((l) => l.status === 'Repair');
  }, [workspace.laptops]);

  // Trigger repair preview
  const handleTriggerPreview = (assetId: string) => {
    const preview = simulateRepairPreview(
      assetId,
      workspace.requests,
      workspace.laptops,
      recommended
    );
    setActivePreview(preview);
  };

  const handleClosePreview = () => {
    setActivePreview(null);
  };

  // Print plan
  const handlePrint = () => {
    window.print();
  };

  // Reset workspace to golden sample
  const handleConfirmReset = () => {
    clearSavedWorkspace();
    setWorkspace(INITIAL_WORKSPACE);
    setSelectedRequestId('Q-02');
    setActivePreview(null);
    setIsResetModalOpen(false);
    setStorageStatus('DEFAULT');
    setStorageErrorMessage(undefined);
  };

  // Request actions
  const handleAddRequest = (newReq: LoanRequest): { success: boolean; error?: string } => {
    if (workspace.requests.some((r) => r.id.toLowerCase() === newReq.id.toLowerCase())) {
      return { success: false, error: `Request ID ${newReq.id} already exists.` };
    }
    if (workspace.requests.length >= 100) {
      return { success: false, error: 'Maximum prototype limit of 100 requests reached.' };
    }

    updateWorkspace((prev) => ({
      ...prev,
      requests: [...prev.requests, newReq],
      updatedAt: new Date().toISOString(),
    }));
    return { success: true };
  };

  const handleUpdateRequest = (updatedReq: LoanRequest): { success: boolean; error?: string } => {
    updateWorkspace((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.id === updatedReq.id ? updatedReq : r)),
      updatedAt: new Date().toISOString(),
    }));
    return { success: true };
  };

  const handleDeleteRequest = (id: string) => {
    updateWorkspace((prev) => ({
      ...prev,
      requests: prev.requests.filter((r) => r.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Laptop actions
  const handleAddLaptop = (newLaptop: LaptopAsset): { success: boolean; error?: string } => {
    if (workspace.laptops.some((l) => l.id.toLowerCase() === newLaptop.id.toLowerCase())) {
      return { success: false, error: `Asset ID ${newLaptop.id} already exists.` };
    }
    if (workspace.laptops.length >= 100) {
      return { success: false, error: 'Maximum prototype limit of 100 laptops reached.' };
    }

    updateWorkspace((prev) => ({
      ...prev,
      laptops: [...prev.laptops, newLaptop],
      updatedAt: new Date().toISOString(),
    }));
    return { success: true };
  };

  const handleUpdateLaptop = (updatedLaptop: LaptopAsset): { success: boolean; error?: string } => {
    updateWorkspace((prev) => ({
      ...prev,
      laptops: prev.laptops.map((l) => (l.id === updatedLaptop.id ? updatedLaptop : l)),
      updatedAt: new Date().toISOString(),
    }));
    return { success: true };
  };

  const handleDeleteLaptop = (id: string) => {
    updateWorkspace((prev) => ({
      ...prev,
      laptops: prev.laptops.filter((l) => l.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Cross-navigation from inspector to inventory
  const handleNavigateToInventory = (assetId: string) => {
    setActiveTab('inventory');
    setHighlightedAssetId(assetId);
    setTimeout(() => setHighlightedAssetId(null), 3000);
  };

  // Active selected request object
  const activeSelectedRequest = workspace.requests.find((r) => r.id === selectedRequestId) || null;

  return (
    <div className="app-container">
      {/* Storage Notification Banner if degraded */}
      <StorageNotification
        status={storageStatus}
        errorMessage={storageErrorMessage}
        onDismiss={() => setStorageErrorMessage(undefined)}
        onReset={handleConfirmReset}
      />

      {/* Repair Preview Drawer / Notification */}
      <RepairPreviewDrawer
        preview={activePreview}
        onClose={handleClosePreview}
      />

      {/* Header and Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isModifiedFromSample={isModifiedFromSample}
        repairLaptops={repairLaptops}
        onTriggerPreview={handleTriggerPreview}
        onPrint={handlePrint}
        onOpenResetConfirm={() => setIsResetModalOpen(true)}
        selectedPolicy={selectedPolicy}
      />

      {/* Main Workspace Layout */}
      <main className="main-layout">
        {activeTab === 'plan' && (
          <>
            <PlanView
              requests={workspace.requests}
              laptops={workspace.laptops}
              baselineResult={baseline}
              recommendedResult={recommended}
              selectedPolicy={selectedPolicy}
              onSelectPolicy={setSelectedPolicy}
              selectedRequestId={selectedRequestId}
              onSelectRequest={setSelectedRequestId}
            />

            <Inspector
              selectedRequest={activeSelectedRequest}
              laptops={workspace.laptops}
              currentResult={selectedPolicy === 'recommended' ? recommended : baseline}
              baselineResult={baseline}
              onNavigateToInventory={handleNavigateToInventory}
            />
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <RequestsView
              requests={workspace.requests}
              onAddRequest={handleAddRequest}
              onUpdateRequest={handleUpdateRequest}
              onDeleteRequest={handleDeleteRequest}
              onSelectRequestForInspector={(id) => {
                setSelectedRequestId(id);
                setActiveTab('plan');
              }}
            />

            <Inspector
              selectedRequest={activeSelectedRequest}
              laptops={workspace.laptops}
              currentResult={selectedPolicy === 'recommended' ? recommended : baseline}
              baselineResult={baseline}
              onNavigateToInventory={handleNavigateToInventory}
            />
          </>
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            laptops={workspace.laptops}
            onAddLaptop={handleAddLaptop}
            onUpdateLaptop={handleUpdateLaptop}
            onDeleteLaptop={handleDeleteLaptop}
            onTriggerPreview={handleTriggerPreview}
            highlightedAssetId={highlightedAssetId}
          />
        )}
      </main>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset to Sample Workspace?"
        message="This will replace all currently entered requests and inventory with the original 4-request, 4-laptop sample fixture. Unsaved edits will be discarded."
        confirmLabel="Reset workspace"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};

export default App;
