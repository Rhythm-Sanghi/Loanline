import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
export const ConfirmModal = ({ isOpen, title, message, confirmLabel, onConfirm, onCancel, }) => {
    const cancelBtnRef = useRef(null);
    const previouslyFocusedElement = useRef(null);
    useEffect(() => {
        if (isOpen) {
            previouslyFocusedElement.current = document.activeElement;
            // Focus cancel button by default to avoid accidental confirmation
            cancelBtnRef.current?.focus();
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
        else if (previouslyFocusedElement.current) {
            previouslyFocusedElement.current.focus();
        }
    }, [isOpen, onCancel]);
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "modal-backdrop no-print", role: "presentation", onClick: (e) => {
            if (e.target === e.currentTarget)
                onCancel();
        }, children: _jsxs("div", { className: "modal-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "confirm-modal-title", children: [_jsx("h3", { id: "confirm-modal-title", className: "modal-title", children: title }), _jsx("p", { className: "modal-body", children: message }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { ref: cancelBtnRef, type: "button", className: "btn", onClick: onCancel, children: "Cancel" }), _jsx("button", { type: "button", className: "btn btn-warning", onClick: onConfirm, children: confirmLabel })] })] }) }));
};
