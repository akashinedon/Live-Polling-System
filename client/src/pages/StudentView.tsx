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

            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: '100%', maxWidth: 700 }}>
                    {/* Main content area */}
                    {state.isLoading ? (
                        <StudentSkeleton />
                    ) : !state.poll ? (
                        <WaitingForPoll />
                    ) : !state.poll.isActive || isExpired ? (
                        /* Results view */
                        <div className="animate-scaleIn" style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <span className="intervue-badge">Intervue Poll</span>
                            </div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Question</h2>
                            <div style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                padding: '0.875rem 1.25rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.95rem',
                                marginBottom: '1.5rem',
                                textAlign: 'left',
                            }}>
                                {state.poll.question}
                            </div>
                            <ResultsPanel
                                results={state.results}
                                totalVotes={state.totalVotes}
                                selectedOptionId={state.selectedOptionId}
                                animate={true}
                            />
                        </div>
                    ) : state.hasVoted ? (
                        /* Voted — waiting for results with live update */
                        <div className="animate-scaleIn" style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <span className="intervue-badge">Intervue Poll</span>
                            </div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Question</h2>
                            <div style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                padding: '0.875rem 1.25rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.95rem',
                                marginBottom: '1rem',
                                textAlign: 'left',
                            }}>
                                {state.poll.question}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <Timer seconds={seconds} progress={progress} isExpired={isExpired} size={60} />
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
                        <div className="animate-scaleIn" style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <span className="intervue-badge">Intervue Poll</span>
                            </div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Question</h2>

                            {/* Question bar */}
                            <div style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                padding: '0.875rem 1.25rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.95rem',
                                marginBottom: '1.5rem',
                                textAlign: 'left',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span>{state.poll.question}</span>
                                <Timer seconds={seconds} progress={progress} isExpired={isExpired} size={36} />
                            </div>

                            {/* Options as horizontal bars */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {state.poll.options.map((opt, i) => {
                                    const isSelected = selectedOption === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            id={`option-btn-${i}`}
                                            onClick={() => setSelectedOption(opt.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.875rem 1.25rem',
                                                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                borderRadius: 'var(--radius-md)',
                                                background: isSelected ? 'rgba(108, 99, 255, 0.08)' : 'var(--color-surface)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s ease',
                                                color: 'var(--color-text)',
                                                fontFamily: 'var(--font-family)',
                                                fontWeight: isSelected ? 600 : 400,
                                                width: '100%',
                                                fontSize: '0.95rem',
                                            }}
                                        >
                                            <span className="option-number"
                                                style={{
                                                    background: isSelected ? 'var(--color-primary)' : 'var(--color-primary)',
                                                    opacity: isSelected ? 1 : 0.7,
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                            <span>{opt.text}</span>
                                            {isSelected && (
                                                <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontSize: '1.1rem' }}>✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                id="submit-vote-btn"
                                className="btn btn-primary btn-lg"
                                onClick={handleVote}
                                disabled={!selectedOption || isExpired}
                                style={{ minWidth: 180 }}
                            >
                                {isExpired ? 'Time Expired' : selectedOption ? 'Submit Answer' : 'Select an option'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ChatPopup messages={chatMessages} onSend={sendChat} name={studentName} role="student" />
        </>
    );
};

/* Waiting screen — matches Figma "Wait for the teacher to ask questions.." */
const WaitingForPoll: React.FC = () => (
    <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
            <span className="intervue-badge">Intervue Poll</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="spinner" />
        </div>
        <h2 style={{ fontWeight: 400 }}>Wait for the teacher to ask questions..</h2>
    </div>
);

const StudentSkeleton: React.FC = () => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 32, width: 120, margin: '0 auto 1.5rem', borderRadius: 'var(--radius-full)' }} />
        <div className="skeleton" style={{ height: 40, width: '60%', margin: '0 auto 1rem' }} />
        <div className="skeleton" style={{ height: 44, width: '100%', marginBottom: '0.75rem', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: 44, width: '100%', marginBottom: '0.75rem', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: 44, width: '100%', marginBottom: '0.75rem', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 'var(--radius-md)' }} />
    </div>
);
