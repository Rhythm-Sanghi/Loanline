import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
export const InventoryView = ({ laptops, onAddLaptop, onUpdateLaptop, onDeleteLaptop, onTriggerPreview, highlightedAssetId, }) => {
    const [isEditing, setIsEditing] = useState(null);
    // Form states
    const [formId, setFormId] = useState('');
    const [formDesk, setFormDesk] = useState('North');
    const [formRam, setFormRam] = useState(8);
    const [formCharger, setFormCharger] = useState('yes');
    const [formBattery, setFormBattery] = useState('yes');
    const [formStatus, setFormStatus] = useState('Ready');
    const [formError, setFormError] = useState(null);
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
    const handleStartEdit = (laptop) => {
        setIsEditing(laptop.id);
        setFormId(laptop.id);
        setFormDesk(laptop.pickupDesk);
        setFormRam(laptop.ramGb);
        setFormCharger(laptop.chargerVerified);
        setFormBattery(laptop.batteryVerified);
        setFormStatus(laptop.status);
        setFormError(null);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);
        const trimmedId = formId.trim();
        if (!trimmedId) {
            setFormError('Asset ID is required (e.g. LT-05).');
            return;
        }
        const newLaptop = {
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
            }
            else {
                resetForm();
            }
        }
        else {
            const res = onAddLaptop(newLaptop);
            if (!res.success) {
                setFormError(res.error || 'Failed to add laptop.');
            }
            else {
                resetForm();
            }
        }
    };
    return (_jsx("div", { className: "content-work-area", children: _jsxs("section", { className: "panel", "aria-label": "Inventory Management", children: [_jsx("div", { className: "panel-header", children: _jsxs("div", { children: [_jsxs("h2", { className: "panel-title", children: ["Refurbished Laptop Inventory", _jsxs("span", { className: "badge badge-mono", children: [laptops.length, " Assets"] })] }), _jsx("p", { className: "panel-subtitle", children: "Charger and battery verification are recorded separately from readiness status." })] }) }), _jsxs("form", { className: "form-panel", onSubmit: handleSubmit, children: [_jsx("div", { style: { fontWeight: 600, fontSize: '0.8125rem', marginBottom: '8px' }, children: isEditing ? `Edit Asset ${isEditing}` : 'Register New Asset' }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "lap-id", children: "Asset ID" }), _jsx("input", { id: "lap-id", type: "text", className: "form-control mono-val", placeholder: "e.g. LT-05", value: formId, disabled: Boolean(isEditing), onChange: (e) => setFormId(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "lap-desk", children: "Pickup Desk" }), _jsxs("select", { id: "lap-desk", className: "form-control", value: formDesk, onChange: (e) => setFormDesk(e.target.value), children: [_jsx("option", { value: "North", children: "North" }), _jsx("option", { value: "South", children: "South" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "lap-ram", children: "RAM" }), _jsxs("select", { id: "lap-ram", className: "form-control", value: formRam, onChange: (e) => setFormRam(Number(e.target.value)), children: [_jsx("option", { value: 4, children: "4 GB" }), _jsx("option", { value: 8, children: "8 GB" }), _jsx("option", { value: 16, children: "16 GB" }), _jsx("option", { value: 32, children: "32 GB" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "lap-charger", children: "Charger Verified" }), _jsxs("select", { id: "lap-charger", className: "form-control", value: formCharger, onChange: (e) => setFormCharger(e.target.value), children: [_jsx("option", { value: "yes", children: "Yes (Verified)" }), _jsx("option", { value: "no", children: "No (Unverified)" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "lap-battery", children: "Battery Verified" }), _jsxs("select", { id: "lap-battery", className: "form-control", value: formBattery, onChange: (e) => setFormBattery(e.target.value), children: [_jsx("option", { value: "yes", children: "Yes (Verified)" }), _jsx("option", { value: "no", children: "No (Unverified)" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "lap-status", children: "Readiness Status" }), _jsxs("select", { id: "lap-status", className: "form-control", value: formStatus, onChange: (e) => setFormStatus(e.target.value), children: [_jsx("option", { value: "Ready", children: "Ready" }), _jsx("option", { value: "Repair", children: "Repair" }), _jsx("option", { value: "Held", children: "Held" })] })] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { type: "submit", className: "btn btn-primary", children: isEditing ? 'Save edits' : 'Add asset' }), isEditing && (_jsx("button", { type: "button", className: "btn", onClick: resetForm, children: "Cancel" }))] })] }), formError && (_jsx("div", { className: "form-error-msg", style: { marginTop: '8px' }, children: formError }))] }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", "aria-label": "Inventory table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Asset ID" }), _jsx("th", { scope: "col", children: "Pickup Desk" }), _jsx("th", { scope: "col", children: "RAM" }), _jsx("th", { scope: "col", children: "Charger Verified" }), _jsx("th", { scope: "col", children: "Battery Verified" }), _jsx("th", { scope: "col", children: "Readiness Status" }), _jsx("th", { scope: "col", children: "Actions" })] }) }), _jsx("tbody", { children: laptops.map((laptop) => {
                                    const isHighlighted = laptop.id === highlightedAssetId;
                                    return (_jsxs("tr", { className: isHighlighted ? 'selected' : '', children: [_jsx("td", { className: "mono-val", style: { fontWeight: 600 }, children: laptop.id }), _jsx("td", { children: laptop.pickupDesk }), _jsxs("td", { children: [laptop.ramGb, " GB"] }), _jsx("td", { children: _jsx("span", { className: `badge ${laptop.chargerVerified === 'yes' ? 'badge-ready' : 'badge-error'}`, children: laptop.chargerVerified === 'yes' ? 'Verified Yes' : 'No' }) }), _jsx("td", { children: _jsx("span", { className: `badge ${laptop.batteryVerified === 'yes' ? 'badge-ready' : 'badge-held'}`, children: laptop.batteryVerified === 'yes' ? 'Verified Yes' : 'No' }) }), _jsx("td", { children: _jsx("span", { className: `badge ${laptop.status === 'Ready'
                                                        ? 'badge-ready'
                                                        : laptop.status === 'Repair'
                                                            ? 'badge-repair'
                                                            : 'badge-held'}`, children: laptop.status }) }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', gap: '4px' }, children: [laptop.status === 'Repair' && (_jsx("button", { type: "button", className: "btn btn-sm btn-warning", onClick: () => onTriggerPreview(laptop.id), title: "Preview impact if this repair is completed", children: "What if? Preview" })), _jsx("button", { type: "button", className: "btn btn-sm", onClick: () => handleStartEdit(laptop), children: "Edit" }), _jsx("button", { type: "button", className: "btn btn-sm", onClick: () => onDeleteLaptop(laptop.id), style: { color: 'var(--status-error-text)' }, children: "Delete" })] }) })] }, laptop.id));
                                }) })] }) })] }) }));
};
