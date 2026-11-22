import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { PolicyComparison } from './PolicyComparison';
export const PlanView = ({ requests, laptops, baselineResult, recommendedResult, selectedPolicy, onSelectPolicy, selectedRequestId, onSelectRequest, }) => {
    const activeResult = selectedPolicy === 'recommended' ? recommendedResult : baselineResult;
    // Keyboard navigation up and down rows
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
                return;
            }
            if (requests.length === 0)
                return;
            const currentIndex = requests.findIndex((r) => r.id === selectedRequestId);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = currentIndex < requests.length - 1 ? currentIndex + 1 : 0;
                onSelectRequest(requests[nextIndex].id);
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : requests.length - 1;
                onSelectRequest(requests[prevIndex].id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [requests, selectedRequestId, onSelectRequest]);
    return (_jsxs("div", { className: "content-work-area", children: [_jsxs("div", { className: "print-header", children: [_jsx("h1", { children: "Campus Laptop Lending Program \u00B7 Allocation Proposal" }), _jsx("p", { children: "Generated for coordinator review \u00B7 Modeled with two pickup desks (North, South)" }), _jsxs("p", { children: [_jsx("strong", { children: "Selected Policy:" }), " ", activeResult.policyName, " (", activeResult.servedCount, " of ", activeResult.totalRequests, " requests served)"] }), _jsx("span", { className: "print-disclaimer", children: "Proposed assignment for review \u00B7 Subject to physical asset check" })] }), _jsx(PolicyComparison, { baselineResult: baselineResult, recommendedResult: recommendedResult, selectedPolicy: selectedPolicy, onSelectPolicy: onSelectPolicy }), _jsxs("section", { className: "panel", "aria-label": "Allocation Table", children: [_jsx("div", { className: "panel-header", children: _jsxs("div", { children: [_jsxs("h2", { className: "panel-title", children: ["Batch Requests & Proposed Assignments", _jsxs("span", { className: "badge badge-mono", children: [activeResult.servedCount, " / ", requests.length, " Assigned"] })] }), _jsx("p", { className: "panel-subtitle", children: "Use arrow keys or click to inspect constraints and compatibility evidence." })] }) }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", role: "grid", "aria-label": "Lending desk batch allocation", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Status" }), _jsx("th", { scope: "col", children: "Request ID" }), _jsx("th", { scope: "col", children: "Queue UTC" }), _jsx("th", { scope: "col", children: "Allowed Desks" }), _jsx("th", { scope: "col", children: "Min RAM" }), _jsx("th", { scope: "col", children: "Battery Req" }), _jsx("th", { scope: "col", children: "Assigned Device" }), _jsx("th", { scope: "col", children: "Device Specs" }), _jsx("th", { scope: "col", children: "Policy Change" })] }) }), _jsx("tbody", { children: requests.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, style: { textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }, children: "No requests recorded in the current batch. Add requests in the Requests tab." }) })) : (requests.map((req, idx) => {
                                        const assignedAssetId = activeResult.assignments[req.id] || null;
                                        const isSelected = req.id === selectedRequestId;
                                        const baselineAssetId = baselineResult.assignments[req.id] || null;
                                        const isChanged = selectedPolicy === 'recommended' &&
                                            assignedAssetId !== baselineAssetId;
                                        const assignedLaptop = assignedAssetId
                                            ? laptops.find((l) => l.id === assignedAssetId)
                                            : null;
                                        return (_jsxs("tr", { onClick: () => onSelectRequest(req.id), className: `${isSelected ? 'selected' : ''} ${isChanged ? 'table-row-changed' : ''}`, role: "row", "aria-selected": isSelected, tabIndex: 0, onKeyDown: (e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onSelectRequest(req.id);
                                                }
                                            }, children: [_jsx("td", { children: assignedAssetId ? (_jsx("span", { className: "badge badge-matched", children: "Matched" })) : (_jsx("span", { className: "badge badge-waiting", children: "Waiting" })) }), _jsx("td", { className: "mono-val", style: { fontWeight: 600 }, children: req.id }), _jsxs("td", { style: { fontSize: '0.75rem', color: 'var(--color-text-secondary)' }, children: ["#", idx + 1, " (", req.queueTimestamp.replace('T', ' ').replace('Z', ' UTC'), ")"] }), _jsx("td", { children: req.allowedDesks.join(', ') }), _jsxs("td", { children: [req.minRamGb, " GB"] }), _jsx("td", { children: req.batteryRequired ? 'Yes (Verified)' : 'No' }), _jsx("td", { className: "mono-val", style: { fontWeight: 600 }, children: assignedAssetId || '—' }), _jsx("td", { style: { fontSize: '0.75rem' }, children: assignedLaptop
                                                        ? `${assignedLaptop.ramGb} GB · ${assignedLaptop.pickupDesk}`
                                                        : '—' }), _jsx("td", { children: isChanged ? (_jsx("span", { className: "badge badge-changed", children: baselineAssetId === null ? 'Newly served' : `Reassigned (${baselineAssetId})` })) : (_jsx("span", { style: { color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }, children: "Unchanged" })) })] }, req.id));
                                    })) })] }) })] })] }));
};
