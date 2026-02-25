import React from 'react';
import { VoteResult } from '../types';

interface VoteBarProps {
    result: VoteResult;
    isSelected?: boolean;
    rank?: number;
    animate?: boolean;
}

const barColors = [
    'linear-gradient(90deg, #6366f1, #a855f7)',
    'linear-gradient(90deg, #06b6d4, #6366f1)',
    'linear-gradient(90deg, #10b981, #06b6d4)',
    'linear-gradient(90deg, #f59e0b, #ef4444)',
    'linear-gradient(90deg, #a855f7, #ec4899)',
    'linear-gradient(90deg, #ef4444, #f59e0b)',
];

export const VoteBar: React.FC<VoteBarProps> = ({ result, isSelected, rank = 0, animate = true }) => {
    return (
        <div
            style={{
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: isSelected
                    ? 'rgba(99, 102, 241, 0.12)'
                    : 'var(--color-surface-2)',
                border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'var(--color-border)'}`,
                transition: 'all 0.3s ease',
                animation: animate ? 'fadeIn 0.4s ease' : undefined,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>
                    {isSelected && <span style={{ marginRight: '0.4rem' }}>✓</span>}
                    {result.text}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{result.votes} votes</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-light)', minWidth: '3ch', textAlign: 'right' }}>
                        {result.percentage}%
                    </span>
                </div>
            </div>
            <div className="progress-track">
                <div
                    className="progress-fill"
                    style={{
                        width: `${result.percentage}%`,
                        background: barColors[rank % barColors.length],
                    }}
                />
            </div>
        </div>
    );
};

export const ResultsPanel: React.FC<{
    results: VoteResult[];
    totalVotes: number;
    selectedOptionId?: string | null;
    animate?: boolean;
}> = ({ results, totalVotes, selectedOptionId, animate }) => {
    const sorted = [...results].sort((a, b) => b.votes - a.votes);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Live Results</span>
                <span
                    style={{
                        fontSize: '0.8rem', color: 'var(--color-primary-light)',
                        background: 'rgba(99,102,241,0.12)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                    }}
                >
                    {totalVotes} {totalVotes === 1 ? 'response' : 'responses'}
                </span>
            </div>
            {sorted.map((r, i) => (
                <VoteBar
                    key={r.optionId}
                    result={r}
                    isSelected={selectedOptionId === r.optionId}
                    rank={i}
                    animate={animate}
                />
            ))}
        </div>
    );
};
