import React from 'react';

interface TimerProps {
    seconds: number;
    progress: number; // 0 to 1
    isExpired: boolean;
    size?: number;
}

export const Timer: React.FC<TimerProps> = ({ seconds, progress, isExpired, size = 100 }) => {
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    const color = isExpired
        ? 'var(--color-error)'
        : progress > 0.5
            ? 'var(--color-success)'
            : progress > 0.25
                ? 'var(--color-warning)'
                : 'var(--color-error)';

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke="var(--color-surface-3)"
                    strokeWidth="5"
                />
                {/* Progress arc */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
                />
            </svg>
            <div
                style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                }}
            >
                <span style={{ fontSize: size * 0.26, fontWeight: 800, color, lineHeight: 1 }}>
                    {isExpired ? '0' : seconds}
                </span>
                <span style={{ fontSize: size * 0.12, color: 'var(--color-text-muted)', fontWeight: 500 }}>sec</span>
            </div>
        </div>
    );
};
