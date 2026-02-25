import React from 'react';
import { VoteResult } from '../types';

interface VoteBarProps {
    result: VoteResult;
    isSelected?: boolean;
    rank?: number;
    animate?: boolean;
}

export const VoteBar: React.FC<VoteBarProps> = ({ result, isSelected, rank = 0, animate = true }) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                animation: animate ? 'fadeIn 0.4s ease' : undefined,
            }}
        >
            {/* Number badge */}
            <span className="option-number">{rank + 1}</span>

            {/* Bar container */}
            <div style={{ flex: 1, position: 'relative' }}>
                <div className="progress-track" style={{
                    border: isSelected ? '2px solid var(--color-primary)' : 'none',
                }}>
                    <div
                        className="progress-fill"
                        style={{
                            width: `${Math.max(result.percentage, 2)}%`,
                            background: 'var(--color-primary)',
                        }}
                    >
                        <span style={{
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                        }}>
                            {result.text}
                        </span>
                    </div>
                </div>
            </div>

            {/* Percentage */}
            <span style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                minWidth: '3.5ch',
                textAlign: 'right',
            }}>
                {result.percentage}%
            </span>
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
            {sorted.map((r, i) => (
                <VoteBar
                    key={r.optionId}
                    result={r}
                    isSelected={selectedOptionId === r.optionId}
                    rank={i}
                    animate={animate}
                />
            ))}
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {totalVotes} {totalVotes === 1 ? 'response' : 'responses'}
            </div>
        </div>
    );
};
