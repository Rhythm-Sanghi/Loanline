import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export const StorageNotification = ({ status, errorMessage, onDismiss, onReset, }) => {
    if (status === 'OK' || status === 'DEFAULT')
        return null;
    return (_jsxs("div", { className: "notification-banner banner-warning no-print", role: "alert", children: [_jsxs("div", { children: [_jsxs("strong", { children: ["Storage Notice (", status, "):"] }), ' ', errorMessage || 'Workspace storage encountered an issue.', ' ', _jsx("span", { children: "Changes will remain active in memory." })] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { type: "button", className: "btn btn-sm", onClick: onReset, children: "Reset to Sample" }), _jsx("button", { type: "button", className: "btn btn-sm", onClick: onDismiss, children: "Dismiss" })] })] }));
};
