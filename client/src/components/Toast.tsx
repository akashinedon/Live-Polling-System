import React, { useEffect, useState } from 'react';
import { Toast as ToastType, ToastType as TType } from '../hooks/useToast';

const icons: Record<TType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
};

const colors: Record<TType, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-info)',
    warning: 'var(--color-warning)',
};

const ToastItem: React.FC<{ toast: ToastType; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const [visible, setVisible] = useState(true);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => onRemove(toast.id), 300);
    };

    return (
        <div
            onClick={handleClose}
            style={{
                animation: visible ? 'slideInRight 0.3s ease' : 'fadeOut 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                background: 'var(--color-surface)',
                border: `1px solid ${colors[toast.type]}40`,
                borderLeft: `4px solid ${colors[toast.type]}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                cursor: 'pointer',
                maxWidth: '360px',
                width: '100%',
            }}
        >
            <span style={{ color: colors[toast.type], fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>
                {icons[toast.type]}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-2)', flex: 1 }}>{toast.message}</span>
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: ToastType[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                pointerEvents: 'none',
            }}
        >
            {toasts.map((t) => (
                <div key={t.id} style={{ pointerEvents: 'all' }}>
                    <ToastItem toast={t} onRemove={removeToast} />
                </div>
            ))}
        </div>
    );
};
