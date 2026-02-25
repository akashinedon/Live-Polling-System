import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { usePoll } from '../hooks/usePoll';
import { usePollTimer } from '../hooks/usePollTimer';
import { useToast } from '../hooks/useToast';
import { Timer } from '../components/Timer';
import { ResultsPanel } from '../components/ResultsPanel';
import { ChatPopup } from '../components/ChatPopup';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { ToastContainer } from '../components/Toast';
import { ChatMessage } from '../types';

export const StudentView: React.FC = () => {
    const { studentName, setRole, setStudentName } = useApp();
    const { isConnected, connectionStatus, emit, on } = useSocket();
    const { toasts, showToast, removeToast } = useToast();
    const { state, setState, submitVote, handlers } = usePoll({
        role: 'student',
        studentName,
        onEvent: undefined,
    });

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Timer sync with server
    const startTime = state.poll ? new Date(state.poll.startTime).getTime() : null;
    const duration = state.poll?.duration ?? null;

    const { seconds, progress, isExpired } = usePollTimer({
        startTime,
        duration,
        onExpire: useCallback(() => {
            if (state.poll?.isActive) {
                showToast("Time's up! Showing results…", 'info');
                setState((prev) => ({
                    ...prev,
                    poll: prev.poll ? { ...prev.poll, isActive: false } : null,
                }));
            }
        }, [state.poll, showToast, setState]),
    });

    // Register as student
    useEffect(() => {
        if (!isConnected) return;
        emit('register:student', { studentName });
    }, [isConnected, emit, studentName]);

    // Bind socket events
    useEffect(() => {
        const unsubNew = on('poll:new', handlers.handlePollNew as (...args: unknown[]) => void);
        const unsubState = on('poll:state', handlers.handlePollState as (...args: unknown[]) => void);
        const unsubResults = on('poll:results_update', handlers.handleResultsUpdate as (...args: unknown[]) => void);
        const unsubEnded = on('poll:ended', handlers.handlePollEnded as (...args: unknown[]) => void);
        const unsubRemoved = on('poll:student_removed', handlers.handleStudentRemoved as (...args: unknown[]) => void);
        const unsubChat = on('chat:message', (data: unknown) => {
            setChatMessages((prev) => [...prev, data as ChatMessage]);
        });

        return () => {
            unsubNew?.(); unsubState?.(); unsubResults?.(); unsubEnded?.(); unsubRemoved?.(); unsubChat?.();
        };
    }, [on, handlers]);

    const handleVote = useCallback(() => {
        if (!selectedOption) return;
        submitVote(selectedOption, emit);
    }, [selectedOption, submitVote, emit]);

    const sendChat = (msg: string) => {
        emit('chat:message', { name: studentName, message: msg, role: 'student' });
    };

    return (
        <>
            <ConnectionBanner status={connectionStatus} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div style={{ minHeight: '100vh', padding: '2rem 1rem', paddingTop: '3rem' }}>
                <div className="container" style={{ maxWidth: 640 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: 'var(--gradient-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.1rem', fontWeight: 700, color: 'white',
                            }}>
                                {studentName[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{studentName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div className={`status-dot ${connectionStatus}`} />
                                    {connectionStatus}
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn btn-ghost btn-sm"
                            id="student-logout-btn"
                            onClick={() => { setRole(null); setStudentName(''); }}
                        >
                            Leave
                        </button>
                    </div>

                    {/* Main content area */}
                    {state.isLoading ? (
                        <StudentSkeleton />
                    ) : !state.poll ? (
                        <WaitingForPoll />
                    ) : !state.poll.isActive || isExpired ? (
                        /* Results view */
                        <div className="card animate-scaleIn" style={{ padding: '2rem' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
                                <h3 style={{ marginBottom: '0.25rem' }}>Poll Results</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{state.poll.question}</p>
                            </div>
                            <ResultsPanel
                                results={state.results}
                                totalVotes={state.totalVotes}
                                selectedOptionId={state.selectedOptionId}
                                animate={true}
                            />
                        </div>
                    ) : state.hasVoted ? (
                        /* Voted — waiting for results */
                        <div className="card animate-scaleIn" style={{ padding: '2rem' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                                <h3 style={{ marginBottom: '0.25rem' }}>Answer Submitted!</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Live results updating in real-time</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <Timer seconds={seconds} progress={progress} isExpired={isExpired} size={90} />
                            </div>
                            <ResultsPanel
                                results={state.results}
                                totalVotes={state.totalVotes}
                                selectedOptionId={state.selectedOptionId}
                                animate={true}
                            />
                        </div>
                    ) : (
                        /* Active poll — vote! */
                        <div className="card animate-scaleIn" style={{ padding: '2rem' }}>
                            {/* Question header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>Live Question</span>
                                    <h3 style={{ lineHeight: 1.4 }}>{state.poll.question}</h3>
                                </div>
                                <Timer seconds={seconds} progress={progress} isExpired={isExpired} size={88} />
                            </div>

                            {/* Options */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {state.poll.options.map((opt, i) => {
                                    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                                    const isSelected = selectedOption === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            id={`option-btn-${i}`}
                                            onClick={() => setSelectedOption(opt.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                                padding: '1rem 1.25rem',
                                                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                borderRadius: 'var(--radius-md)',
                                                background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--color-surface-2)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s ease',
                                                color: 'var(--color-text)',
                                                fontFamily: 'var(--font-family)',
                                                fontWeight: isSelected ? 600 : 400,
                                                transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                                                    e.currentTarget.style.background = 'var(--color-surface-3)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                                    e.currentTarget.style.background = 'var(--color-surface-2)';
                                                }
                                            }}
                                        >
                                            <span style={{
                                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                                background: isSelected ? 'var(--gradient-primary)' : 'var(--color-surface-3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.8rem', fontWeight: 700, color: isSelected ? 'white' : 'var(--color-text-muted)',
                                            }}>
                                                {letters[i]}
                                            </span>
                                            <span style={{ fontSize: '0.95rem' }}>{opt.text}</span>
                                            {isSelected && <span style={{ marginLeft: 'auto', color: 'var(--color-primary-light)', fontSize: '1.1rem' }}>✓</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                id="submit-vote-btn"
                                className="btn btn-primary btn-lg w-full"
                                onClick={handleVote}
                                disabled={!selectedOption || isExpired}
                            >
                                {isExpired ? 'Time Expired' : selectedOption ? 'Submit Answer →' : 'Select an option'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ChatPopup messages={chatMessages} onSend={sendChat} name={studentName} role="student" />
        </>
    );
};

const WaitingForPoll: React.FC = () => (
    <div className="card animate-fadeIn" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h3 style={{ marginBottom: '0.5rem' }}>Waiting for the teacher…</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            You'll see the poll question here as soon as the teacher starts one
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--color-primary)',
                        animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                ))}
            </div>
        </div>
    </div>
);

const StudentSkeleton: React.FC = () => (
    <div className="card" style={{ padding: '2rem' }}>
        <div className="skeleton" style={{ height: 24, width: '40%', marginBottom: '1.25rem' }} />
        <div className="skeleton" style={{ height: 20, width: '90%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: '2rem' }} />
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 60, marginBottom: '0.75rem', borderRadius: 'var(--radius-md)' }} />
        ))}
    </div>
);
