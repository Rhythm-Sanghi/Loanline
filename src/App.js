import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_WORKSPACE, SAMPLE_REQUESTS, SAMPLE_LAPTOPS } from './domain/sampleData';
import { computeBothAllocations } from './domain/allocator';
import { simulateRepairPreview } from './domain/inspector';
import { loadWorkspace, saveWorkspace, clearSavedWorkspace, } from './storage/storage';
import { Header } from './components/Header';
import { PlanView } from './components/PlanView';
import { RequestsView } from './components/RequestsView';
import { InventoryView } from './components/InventoryView';
import { Inspector } from './components/Inspector';
import { RepairPreviewDrawer } from './components/RepairPreviewDrawer';
import { ConfirmModal } from './components/ConfirmModal';
import { StorageNotification } from './components/StorageNotification';
export const App = () => {
    // Navigation
    const [activeTab, setActiveTab] = useState('plan');
    // Policy selection: 'recommended' is selected by default
    const [selectedPolicy, setSelectedPolicy] = useState('recommended');
    // Workspace Data
    const [workspace, setWorkspace] = useState(INITIAL_WORKSPACE);
    const [storageStatus, setStorageStatus] = useState('DEFAULT');
    const [storageErrorMessage, setStorageErrorMessage] = useState();
    // Selected request for inspector (defaults to Q-02 so the judge immediately sees the reveal)
    const [selectedRequestId, setSelectedRequestId] = useState('Q-02');
    // Highlighted inventory asset
    const [highlightedAssetId, setHighlightedAssetId] = useState(null);
    // Repair preview state
    const [activePreview, setActivePreview] = useState(null);
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
        if (workspace.requests.length !== SAMPLE_REQUESTS.length)
            return true;
        if (workspace.laptops.length !== SAMPLE_LAPTOPS.length)
            return true;
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
        }
        else {
            setSelectedRequestId(null);
        }
    }, [workspace.requests, selectedRequestId]);
    // Save workspace updates to localStorage
    const updateWorkspace = useCallback((updater) => {
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
    const handleTriggerPreview = (assetId) => {
        const preview = simulateRepairPreview(assetId, workspace.requests, workspace.laptops, recommended);
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
    const handleAddRequest = (newReq) => {
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
    const handleUpdateRequest = (updatedReq) => {
        updateWorkspace((prev) => ({
            ...prev,
            requests: prev.requests.map((r) => (r.id === updatedReq.id ? updatedReq : r)),
            updatedAt: new Date().toISOString(),
        }));
        return { success: true };
    };
    const handleDeleteRequest = (id) => {
        updateWorkspace((prev) => ({
            ...prev,
            requests: prev.requests.filter((r) => r.id !== id),
            updatedAt: new Date().toISOString(),
        }));
    };
    // Laptop actions
    const handleAddLaptop = (newLaptop) => {
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
    const handleUpdateLaptop = (updatedLaptop) => {
        updateWorkspace((prev) => ({
            ...prev,
            laptops: prev.laptops.map((l) => (l.id === updatedLaptop.id ? updatedLaptop : l)),
            updatedAt: new Date().toISOString(),
        }));
        return { success: true };
    };
    const handleDeleteLaptop = (id) => {
        updateWorkspace((prev) => ({
            ...prev,
            laptops: prev.laptops.filter((l) => l.id !== id),
            updatedAt: new Date().toISOString(),
        }));
    };
    // Cross-navigation from inspector to inventory
    const handleNavigateToInventory = (assetId) => {
        setActiveTab('inventory');
        setHighlightedAssetId(assetId);
        setTimeout(() => setHighlightedAssetId(null), 3000);
    };
    // Active selected request object
    const activeSelectedRequest = workspace.requests.find((r) => r.id === selectedRequestId) || null;
    return (_jsxs("div", { className: "app-container", children: [_jsx(StorageNotification, { status: storageStatus, errorMessage: storageErrorMessage, onDismiss: () => setStorageErrorMessage(undefined), onReset: handleConfirmReset }), _jsx(RepairPreviewDrawer, { preview: activePreview, onClose: handleClosePreview }), _jsx(Header, { activeTab: activeTab, onSelectTab: setActiveTab, isModifiedFromSample: isModifiedFromSample, repairLaptops: repairLaptops, onTriggerPreview: handleTriggerPreview, onPrint: handlePrint, onOpenResetConfirm: () => setIsResetModalOpen(true), selectedPolicy: selectedPolicy }), _jsxs("main", { className: "main-layout", children: [activeTab === 'plan' && (_jsxs(_Fragment, { children: [_jsx(PlanView, { requests: workspace.requests, laptops: workspace.laptops, baselineResult: baseline, recommendedResult: recommended, selectedPolicy: selectedPolicy, onSelectPolicy: setSelectedPolicy, selectedRequestId: selectedRequestId, onSelectRequest: setSelectedRequestId }), _jsx(Inspector, { selectedRequest: activeSelectedRequest, laptops: workspace.laptops, currentResult: selectedPolicy === 'recommended' ? recommended : baseline, baselineResult: baseline, onNavigateToInventory: handleNavigateToInventory })] })), activeTab === 'requests' && (_jsxs(_Fragment, { children: [_jsx(RequestsView, { requests: workspace.requests, onAddRequest: handleAddRequest, onUpdateRequest: handleUpdateRequest, onDeleteRequest: handleDeleteRequest, onSelectRequestForInspector: (id) => {
                                    setSelectedRequestId(id);
                                    setActiveTab('plan');
                                } }), _jsx(Inspector, { selectedRequest: activeSelectedRequest, laptops: workspace.laptops, currentResult: selectedPolicy === 'recommended' ? recommended : baseline, baselineResult: baseline, onNavigateToInventory: handleNavigateToInventory })] })), activeTab === 'inventory' && (_jsx(InventoryView, { laptops: workspace.laptops, onAddLaptop: handleAddLaptop, onUpdateLaptop: handleUpdateLaptop, onDeleteLaptop: handleDeleteLaptop, onTriggerPreview: handleTriggerPreview, highlightedAssetId: highlightedAssetId }))] }), _jsx(ConfirmModal, { isOpen: isResetModalOpen, title: "Reset to Sample Workspace?", message: "This will replace all currently entered requests and inventory with the original 4-request, 4-laptop sample fixture. Unsaved edits will be discarded.", confirmLabel: "Reset workspace", onConfirm: handleConfirmReset, onCancel: () => setIsResetModalOpen(false) })] }));
};
export default App;
