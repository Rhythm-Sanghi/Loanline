import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const RepairPreviewDrawer = ({ preview, onClose, }) => {
    if (!preview)
        return null;
    const diff = preview.afterServedCount - preview.beforeServedCount;
    return (_jsxs("div", { className: "notification-banner banner-preview no-print", role: "region", "aria-label": "Repair simulation preview banner", style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '12px 24px',
            borderBottom: '2px solid var(--status-repair-border)',
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("span", { className: "badge badge-repair", style: { fontWeight: 700, letterSpacing: '0.04em' }, children: "PREVIEW ONLY" }), _jsxs("span", { style: { fontWeight: 600, fontSize: '0.875rem' }, children: ["Simulating ", preview.targetAssetId, " (", preview.originalStatus, " \u2192 Ready)"] })] }), _jsx("button", { type: "button", className: "btn btn-sm", onClick: onClose, "aria-label": "Close repair preview", children: "\u2715 Close preview" })] }), _jsxs("div", { style: {
                    display: 'flex',
                    gap: '24px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    fontSize: '0.8125rem',
                }, children: [_jsxs("div", { children: [_jsx("strong", { children: "Impact:" }), ' ', preview.beforeServedCount, " served \u2192", ' ', _jsxs("span", { style: { fontWeight: 700, color: 'var(--status-ready-text)' }, children: [preview.afterServedCount, " served"] }), ' ', "(", diff >= 0 ? `+${diff}` : diff, " loans)"] }), preview.newlyServedRequestIds.length > 0 && (_jsxs("div", { children: [_jsx("strong", { children: "Newly served:" }), ' ', preview.newlyServedRequestIds.map((id) => (_jsx("span", { className: "badge badge-ready mono-val", style: { marginLeft: '4px' }, children: id }, id)))] })), preview.remainingWaitingRequestIds.length > 0 && (_jsxs("div", { children: [_jsx("strong", { children: "Still waiting:" }), ' ', preview.remainingWaitingRequestIds.join(', ')] })), preview.remainingBlockers.length > 0 && (_jsxs("div", { style: { color: 'var(--status-error-text)', fontWeight: 600 }, children: ["Remaining blocker: ", preview.remainingBlockers.join('; ')] })), preview.changedPairings.length > 0 && (_jsxs("div", { style: { color: 'var(--color-text-secondary)', fontSize: '0.75rem' }, children: ["Pairings updated:", ' ', preview.changedPairings
                                .map((p) => `${p.requestId} (${p.fromAssetId || 'wait'} → ${p.toAssetId})`)
                                .join(', ')] }))] })] }));
};
