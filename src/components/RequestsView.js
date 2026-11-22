import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
export const RequestsView = ({ requests, onAddRequest, onUpdateRequest, onDeleteRequest, onSelectRequestForInspector, }) => {
    const [isEditing, setIsEditing] = useState(null);
    // Form states
    const [formId, setFormId] = useState('');
    const [formTimestamp, setFormTimestamp] = useState(new Date().toISOString().slice(0, 16) + ':00Z');
    const [formDesks, setFormDesks] = useState(['North']);
    const [formMinRam, setFormMinRam] = useState(8);
    const [formBattery, setFormBattery] = useState(false);
    const [formError, setFormError] = useState(null);
    const resetForm = () => {
        setFormId('');
        setFormTimestamp(new Date().toISOString().slice(0, 16) + ':00Z');
        setFormDesks(['North']);
        setFormMinRam(8);
        setFormBattery(false);
        setFormError(null);
        setIsEditing(null);
    };
    const handleStartEdit = (req) => {
        setIsEditing(req.id);
        setFormId(req.id);
        setFormTimestamp(req.queueTimestamp);
        setFormDesks([...req.allowedDesks]);
        setFormMinRam(req.minRamGb);
        setFormBattery(req.batteryRequired);
        setFormError(null);
    };
    const handleDeskToggle = (deskName) => {
        if (formDesks.includes(deskName)) {
            if (formDesks.length > 1) {
                setFormDesks(formDesks.filter((d) => d !== deskName));
            }
        }
        else {
            setFormDesks([...formDesks, deskName]);
        }
    };
    const handleSubmit = (e) => {
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
        const newReq = {
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
            }
            else {
                resetForm();
            }
        }
        else {
            const res = onAddRequest(newReq);
            if (!res.success) {
                setFormError(res.error || 'Failed to add request.');
            }
            else {
                resetForm();
            }
        }
    };
    return (_jsx("div", { className: "content-work-area", children: _jsxs("section", { className: "panel", "aria-label": "Requests Management", children: [_jsx("div", { className: "panel-header", children: _jsxs("div", { children: [_jsxs("h2", { className: "panel-title", children: ["Fictional Loan Requests", _jsxs("span", { className: "badge badge-mono", children: [requests.length, " Total"] })] }), _jsx("p", { className: "panel-subtitle", children: "Strict privacy model: names, emails, and personal identifiers are excluded by design." })] }) }), _jsxs("form", { className: "form-panel", onSubmit: handleSubmit, children: [_jsx("div", { style: { fontWeight: 600, fontSize: '0.8125rem', marginBottom: '8px' }, children: isEditing ? `Edit Request ${isEditing}` : 'Add Fictional Request' }), _jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "req-id", children: "Request ID" }), _jsx("input", { id: "req-id", type: "text", className: "form-control mono-val", placeholder: "e.g. Q-05", value: formId, disabled: Boolean(isEditing), onChange: (e) => setFormId(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "req-time", children: "Queue Timestamp (UTC)" }), _jsx("input", { id: "req-time", type: "text", className: "form-control mono-val", placeholder: "2026-11-20T10:00:00Z", value: formTimestamp, onChange: (e) => setFormTimestamp(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Allowed Desks" }), _jsxs("div", { style: { display: 'flex', gap: '8px', paddingTop: '4px' }, children: [_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: formDesks.includes('North'), onChange: () => handleDeskToggle('North') }), "North"] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: formDesks.includes('South'), onChange: () => handleDeskToggle('South') }), "South"] })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "req-ram", children: "Minimum RAM" }), _jsxs("select", { id: "req-ram", className: "form-control", value: formMinRam, onChange: (e) => setFormMinRam(Number(e.target.value)), children: [_jsx("option", { value: 4, children: "4 GB" }), _jsx("option", { value: 8, children: "8 GB" }), _jsx("option", { value: 16, children: "16 GB" }), _jsx("option", { value: 32, children: "32 GB" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Portable Battery" }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', height: '32px', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: formBattery, onChange: (e) => setFormBattery(e.target.checked) }), "Require verified battery"] })] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { type: "submit", className: "btn btn-primary", children: isEditing ? 'Save edits' : 'Add request' }), isEditing && (_jsx("button", { type: "button", className: "btn", onClick: resetForm, children: "Cancel" }))] })] }), formError && (_jsx("div", { className: "form-error-msg", style: { marginTop: '8px' }, children: formError }))] }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", "aria-label": "Requests table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Stable ID" }), _jsx("th", { scope: "col", children: "Queue Timestamp (UTC)" }), _jsx("th", { scope: "col", children: "Allowed Desks" }), _jsx("th", { scope: "col", children: "Min RAM" }), _jsx("th", { scope: "col", children: "Battery Required" }), _jsx("th", { scope: "col", children: "Actions" })] }) }), _jsx("tbody", { children: requests.map((req) => (_jsxs("tr", { children: [_jsx("td", { className: "mono-val", style: { fontWeight: 600 }, children: req.id }), _jsx("td", { className: "mono-val", style: { fontSize: '0.75rem' }, children: req.queueTimestamp }), _jsx("td", { children: req.allowedDesks.join(', ') }), _jsxs("td", { children: [req.minRamGb, " GB"] }), _jsx("td", { children: req.batteryRequired ? 'Yes' : 'No' }), _jsx("td", { children: _jsxs("div", { style: { display: 'flex', gap: '4px' }, children: [_jsx("button", { type: "button", className: "btn btn-sm", onClick: () => handleStartEdit(req), children: "Edit" }), _jsx("button", { type: "button", className: "btn btn-sm", onClick: () => onSelectRequestForInspector(req.id), children: "Inspect" }), _jsx("button", { type: "button", className: "btn btn-sm", onClick: () => onDeleteRequest(req.id), style: { color: 'var(--status-error-text)' }, children: "Delete" })] }) })] }, req.id))) })] }) })] }) }));
};
