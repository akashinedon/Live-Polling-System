import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../hooks/useSocket';
import { usePoll } from '../hooks/usePoll';
import { useToast } from '../hooks/useToast';
import { ResultsPanel } from '../components/ResultsPanel';
import { ChatPopup } from '../components/ChatPopup';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { ToastContainer } from '../components/Toast';
import { ChatMessage, PollHistoryItem } from '../types';

export const TeacherDashboard: React.FC = () => {
    const { studentCount, setStudentCount, setRole } = useApp();
    const { isConnected, connectionStatus, emit, on, off } = useSocket();
    const { toasts, showToast, removeToast } = useToast();
    const { state, history, historyLoading, fetchHistory, handlers } = usePoll({
        role: 'teacher',
        studentName: 'Teacher',
        onEvent: undefined,
    });

    const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Poll creation form state
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [duration, setDuration] = useState(60);
    const [isCreating, setIsCreating] = useState(false);

    // Register as teacher and bind socket events
    useEffect(() => {
        if (!isConnected) return;
        emit('register:teacher');
    }, [isConnected, emit]);

    useEffect(() => {
        const unsubNew = on('poll:new', handlers.handlePollNew as (...args: unknown[]) => void);
        const unsubResults = on('poll:results_update', handlers.handleResultsUpdate as (...args: unknown[]) => void);
        const unsubEnded = on('poll:ended', handlers.handlePollEnded as (...args: unknown[]) => void);
        const unsubCount = on('students:count', (data: unknown) => {
            const { count } = data as { count: number };
            setStudentCount(count);
        });
        const unsubChat = on('chat:message', (data: unknown) => {
            setChatMessages((prev) => [...prev, data as ChatMessage]);
        });

        return () => {
            unsubNew?.(); unsubResults?.(); unsubEnded?.(); unsubCount?.(); unsubChat?.();
        };
    }, [on, handlers, setStudentCount]);

    const createPoll = useCallback(() => {
        const q = question.trim();
        const opts = options.map((o) => o.trim()).filter(Boolean);
        if (!q) { showToast('Please enter a question', 'error'); return; }
        if (opts.length < 2) { showToast('Please add at least 2 options', 'error'); return; }

        setIsCreating(true);
        emit('poll:create', { question: q, options: opts, duration, createdBy: 'Teacher' }, (res: unknown) => {
            const r = res as { success: boolean; message?: string };
            setIsCreating(false);
            if (r.success) {
                setQuestion(''); setOptions(['', '']);
                showToast('Poll started! 🚀', 'success');
            } else {
                showToast(r.message || 'Failed to create poll', 'error');
            }
        });
    }, [question, options, duration, emit, showToast]);

    const endPoll = useCallback(() => {
        if (!state.poll) return;
        emit('poll:end', { pollId: state.poll._id }, (res: unknown) => {
            const r = res as { success: boolean };
            if (r.success) showToast('Poll ended', 'info');
        });
    }, [state.poll, emit, showToast]);

    const addOption = () => {
        if (options.length >= 6) { showToast('Maximum 6 options', 'warning'); return; }
        setOptions([...options, '']);
    };

    const removeOption = (i: number) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, idx) => idx !== i));
    };

    const sendChatMessage = (msg: string) => {
        emit('chat:message', { name: 'Teacher', message: msg, role: 'teacher' });
    };

    if (activeTab === 'history' && !history.length && !historyLoading) {
        fetchHistory();
    }

    return (
        <>
            <ConnectionBanner status={connectionStatus} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div style={{ minHeight: '100vh', padding: '2rem 1rem', paddingTop: '3rem' }}>
                <div className="container">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                                <h2>Teacher Dashboard</h2>
                                <span className="badge badge-primary">👨‍🏫</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div className={`status-dot ${connectionStatus}`} />
                                    {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    👥 {studentCount} student{studentCount !== 1 ? 's' : ''} online
                                </span>
                            </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" id="teacher-logout-btn" onClick={() => setRole(null)}>
                            Switch Role
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="tabs">
                        <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} id="tab-dashboard" onClick={() => setActiveTab('dashboard')}>
                            Live Dashboard
                        </button>
                        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} id="tab-history" onClick={() => { setActiveTab('history'); fetchHistory(); }}>
                            Poll History
                        </button>
                    </div>

                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="grid-2">
                            {/* Poll Creator */}
                            <div className="card animate-fadeIn" style={{ padding: '1.75rem' }}>
                                <h3 style={{ marginBottom: '1.25rem' }}>
                                    {state.poll?.isActive ? '🔴 Active Poll' : '✏️ Create New Poll'}
                                </h3>

                                {state.poll?.isActive ? (
                                    <ActivePollCard
                                        question={state.poll.question}
                                        pollId={state.poll._id}
                                        onEnd={endPoll}
                                    />
                                ) : (
                                    <>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>QUESTION</label>
                                            <textarea
                                                id="poll-question-input"
                                                className="input textarea"
                                                placeholder="Ask a question…"
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                                                OPTIONS ({options.length}/6)
                                            </label>
                                            {options.map((opt, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <input
                                                        id={`option-input-${i}`}
                                                        className="input"
                                                        style={{ padding: '0.6rem 1rem', fontSize: '0.875rem' }}
                                                        placeholder={`Option ${i + 1}`}
                                                        value={opt}
                                                        onChange={(e) => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
                                                    />
                                                    {options.length > 2 && (
                                                        <button className="btn btn-danger btn-sm" onClick={() => removeOption(i)}>✕</button>
                                                    )}
                                                </div>
                                            ))}
                                            <button className="btn btn-ghost btn-sm" id="add-option-btn" onClick={addOption} style={{ marginTop: '0.25rem' }}>
                                                + Add Option
                                            </button>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                                                TIMER: {duration}s
                                            </label>
                                            <input
                                                id="duration-slider"
                                                type="range" min={10} max={300} step={5}
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                <span>10s</span><span>5min</span>
                                            </div>
                                        </div>

                                        <button
                                            id="create-poll-btn"
                                            className="btn btn-primary btn-lg w-full"
                                            onClick={createPoll}
                                            disabled={isCreating}
                                        >
                                            {isCreating ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating…</> : '🚀 Start Poll'}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Live Results */}
                            <div className="card animate-fadeIn" style={{ padding: '1.75rem' }}>
                                <h3 style={{ marginBottom: '1.25rem' }}>📊 Live Results</h3>
                                {state.poll ? (
                                    <>
                                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                                            {state.poll.question}
                                        </p>
                                        <ResultsPanel
                                            results={state.results}
                                            totalVotes={state.totalVotes}
                                            animate={true}
                                        />
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                                        <p>Create a poll to see live results here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="animate-fadeIn">
                            {historyLoading ? (
                                <HistorySkeleton />
                            ) : history.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                                    <h3>No poll history yet</h3>
                                    <p>Completed polls will appear here</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {history.map((item: PollHistoryItem) => (
                                        <HistoryCard key={item.pollId} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ChatPopup messages={chatMessages} onSend={sendChatMessage} name="Teacher" role="teacher" />
        </>
    );
};

const ActivePollCard: React.FC<{ question: string; pollId: string; onEnd: () => void }> = ({ question, onEnd }) => (
    <div>
        <div style={{
            padding: '1rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.3)',
            marginBottom: '1.25rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.8rem' }}>
                    ● POLL ACTIVE
                </span>
            </div>
            <p style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}>{question}</p>
        </div>
        <button className="btn btn-danger w-full" id="end-poll-btn" onClick={onEnd}>
            ⏹ End Poll Now
        </button>
    </div>
);

const HistoryCard: React.FC<{ item: PollHistoryItem }> = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const winner = item.results.reduce((a, b) => (b.votes > a.votes ? b : a), item.results[0]);

    return (
        <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <p style={{ color: 'var(--color-text)', fontWeight: 500, marginBottom: '0.5rem' }}>{item.question}</p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {item.totalVotes} {item.totalVotes === 1 ? 'response' : 'responses'}
                        </span>
                        {winner && item.totalVotes > 0 && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>
                                🏆 {winner.text} ({winner.percentage}%)
                            </span>
                        )}
                    </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(!expanded)}>
                    {expanded ? '↑' : '↓'}
                </button>
            </div>
            {expanded && (
                <div style={{ marginTop: '1rem' }}>
                    <ResultsPanel results={item.results} totalVotes={item.totalVotes} animate={false} />
                </div>
            )}
        </div>
    );
};

const HistorySkeleton: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: 80 }}>
                <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: '0.75rem' }} />
                <div className="skeleton" style={{ height: 12, width: '30%' }} />
            </div>
        ))}
    </div>
);
