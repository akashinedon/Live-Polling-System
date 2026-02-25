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

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [participants, setParticipants] = useState<{ socketId: string; name: string }[]>([]);

    // Poll creation form state
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
    ]);
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
        const unsubList = on('students:list', (data: unknown) => {
            setParticipants(data as { socketId: string; name: string }[]);
        });

        return () => {
            unsubNew?.(); unsubResults?.(); unsubEnded?.(); unsubCount?.(); unsubChat?.(); unsubList?.();
        };
    }, [on, handlers, setStudentCount]);

    const createPoll = useCallback(() => {
        const q = question.trim();
        const opts = options.map((o) => o.text.trim()).filter(Boolean);
        if (!q) { showToast('Please enter a question', 'error'); return; }
        if (opts.length < 2) { showToast('Please add at least 2 options', 'error'); return; }

        setIsCreating(true);
        emit('poll:create', { question: q, options: opts, duration, createdBy: 'Teacher' }, (res: unknown) => {
            const r = res as { success: boolean; message?: string };
            setIsCreating(false);
            if (r.success) {
                setQuestion('');
                setOptions([
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                ]);
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
        setOptions([...options, { text: '', isCorrect: false }]);
    };

    const updateOptionText = (i: number, text: string) => {
        const o = [...options];
        o[i] = { ...o[i], text };
        setOptions(o);
    };

    const toggleCorrect = (i: number, value: boolean) => {
        const o = [...options];
        o[i] = { ...o[i], isCorrect: value };
        setOptions(o);
    };

    const removeOption = (i: number) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, idx) => idx !== i));
    };

    const sendChatMessage = (msg: string) => {
        emit('chat:message', { name: 'Teacher', message: msg, role: 'teacher' });
    };

    const kickStudent = (studentName: string) => {
        emit('student:kick', { studentName });
        showToast(`Kicked ${studentName}`, 'info');
    };

    if (!history.length && !historyLoading) {
        // prefetch silently
    }

    return (
        <>
            <ConnectionBanner status={connectionStatus} />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div style={{ minHeight: '100vh', padding: '2.5rem 2rem' }}>
                <div style={{ maxWidth: 720, margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <span className="intervue-badge">Intervue Poll</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ marginBottom: '0.5rem' }}>
                                Let's <strong>Get Started</strong>
                            </h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: 480 }}>
                                you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
                            </p>
                        </div>
                        <button
                            className="btn btn-ghost btn-sm"
                            id="teacher-logout-btn"
                            onClick={() => setRole(null)}
                            style={{ flexShrink: 0, marginTop: '0.5rem' }}
                        >
                            Switch Role
                        </button>
                    </div>

                    {/* Active Poll Results */}
                    {state.poll && (
                        <div style={{ marginBottom: '2rem' }} className="animate-fadeIn">
                            <ResultsPanel
                                results={state.results}
                                totalVotes={state.totalVotes}
                                animate={true}
                            />
                            {state.poll.isActive && (
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <button className="btn btn-danger" id="end-poll-btn" onClick={endPoll}>
                                        End Poll Now
                                    </button>
                                    <button className="btn btn-primary" onClick={() => {
                                        endPoll();
                                        setTimeout(() => {
                                            setQuestion('');
                                            setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
                                        }, 500);
                                    }}>
                                        + Ask a new question
                                    </button>
                                </div>
                            )}
                            {!state.poll.isActive && (
                                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                    <button className="btn btn-primary btn-lg" onClick={() => {
                                        setQuestion('');
                                        setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
                                    }}>
                                        + Ask a new question
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Poll Creation Form */}
                    {!state.poll?.isActive && (
                        <div className="animate-fadeIn">
                            {/* Question Input */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                                    Enter your question
                                </label>
                                <select
                                    className="select"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    id="duration-select"
                                >
                                    <option value={15}>15 seconds</option>
                                    <option value={30}>30 seconds</option>
                                    <option value={60}>60 seconds</option>
                                    <option value={90}>90 seconds</option>
                                    <option value={120}>120 seconds</option>
                                    <option value={180}>180 seconds</option>
                                    <option value={300}>300 seconds</option>
                                </select>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                                <textarea
                                    id="poll-question-input"
                                    className="input textarea"
                                    placeholder="Type your question here..."
                                    value={question}
                                    maxLength={100}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    style={{ minHeight: 100 }}
                                />
                                <div className="char-counter">{question.length}/100</div>
                            </div>

                            {/* Options */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                                    Edit Options
                                </label>
                                <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                                    Is it Correct?
                                </label>
                            </div>

                            {options.map((opt, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <span className="option-number">{i + 1}</span>
                                    <input
                                        id={`option-input-${i}`}
                                        className="input"
                                        style={{ flex: 1 }}
                                        placeholder={`Option ${i + 1}`}
                                        value={opt.text}
                                        onChange={(e) => updateOptionText(i, e.target.value)}
                                    />
                                    <div className="radio-group">
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name={`correct-${i}`}
                                                checked={opt.isCorrect === true}
                                                onChange={() => toggleCorrect(i, true)}
                                            />
                                            Yes
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name={`correct-${i}`}
                                                checked={opt.isCorrect === false}
                                                onChange={() => toggleCorrect(i, false)}
                                            />
                                            No
                                        </label>
                                    </div>
                                    {options.length > 2 && (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeOption(i)}
                                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                className="btn btn-ghost btn-sm"
                                id="add-option-btn"
                                onClick={addOption}
                                style={{ marginTop: '0.25rem', marginBottom: '2rem' }}
                            >
                                + Add More option
                            </button>

                            {/* Ask Question button */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    id="create-poll-btn"
                                    className="btn btn-primary btn-lg"
                                    onClick={createPoll}
                                    disabled={isCreating}
                                    style={{ minWidth: 180 }}
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="spinner-sm" />
                                            Creating…
                                        </>
                                    ) : 'Ask Question'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ChatPopup messages={chatMessages} onSend={sendChatMessage} name="Teacher" role="teacher" participants={participants} onKick={kickStudent} />
        </>
    );
};
