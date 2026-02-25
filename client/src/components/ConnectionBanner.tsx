import React from 'react';

interface ConnectionBannerProps {
    status: 'connected' | 'disconnected' | 'connecting';
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({ status }) => {
    if (status === 'connected') return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                padding: '0.5rem 1rem',
                background: status === 'connecting' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                borderBottom: `1px solid ${status === 'connecting' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: status === 'connecting' ? 'var(--color-warning)' : 'var(--color-error)',
                zIndex: 9000,
            }}
        >
            <div className={`status-dot ${status}`} />
            {status === 'connecting' ? 'Connecting to server…' : 'Disconnected — retrying…'}
        </div>
    );
};
