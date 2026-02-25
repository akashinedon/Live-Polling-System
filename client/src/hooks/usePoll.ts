import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Poll, VoteResult, PollHistoryItem } from '../types';
import { useToast } from './useToast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface PollState {
    poll: Poll | null;
    remainingTime: number;
    results: VoteResult[];
    totalVotes: number;
    hasVoted: boolean;
    selectedOptionId: string | null;
    isLoading: boolean;
}

interface UsePollOptions {
    role: 'teacher' | 'student' | null;
    studentName: string;
    onEvent?: (event: string, data: unknown) => void;
}

export const usePoll = ({ role, studentName, onEvent }: UsePollOptions) => {
    const { showToast } = useToast();
    const [state, setState] = useState<PollState>({
        poll: null,
        remainingTime: 0,
        results: [],
        totalVotes: 0,
        hasVoted: false,
        selectedOptionId: null,
        isLoading: true,
    });
    const [history, setHistory] = useState<PollHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const votingRef = useRef(false);

    // ─── State Recovery: fetch active poll on mount ──────
    useEffect(() => {
        const fetchActivePoll = async () => {
            try {
                const params = studentName ? `?studentName=${encodeURIComponent(studentName)}` : '';
                const res = await axios.get(`${API_BASE}/polls/active${params}`);
                if (res.data.success && res.data.data) {
                    const d = res.data.data;
                    setState((prev) => ({
                        ...prev,
                        poll: d,
                        remainingTime: d.remainingTime,
                        results: d.results || [],
                        totalVotes: d.totalVotes || 0,
                        hasVoted: d.hasVoted || false,
                        isLoading: false,
                    }));
                } else {
                    setState((prev) => ({ ...prev, isLoading: false }));
                }
            } catch {
                setState((prev) => ({ ...prev, isLoading: false }));
            }
        };

        fetchActivePoll();
    }, [studentName, role]);

    // ─── Socket event handlers ───────────────────────────
    const handlePollNew = useCallback((data: { poll: Poll; remainingTime: number }) => {
        setState({
            poll: data.poll,
            remainingTime: data.remainingTime,
            results: [],
            totalVotes: 0,
            hasVoted: false,
            selectedOptionId: null,
            isLoading: false,
        });
        showToast('New poll started!', 'info');
        onEvent?.('poll:new', data);
    }, [showToast, onEvent]);

    const handlePollState = useCallback((data: {
        poll: Poll; remainingTime: number; results: VoteResult[]; totalVotes: number; hasVoted: boolean;
    }) => {
        setState((prev) => ({
            ...prev,
            poll: data.poll,
            remainingTime: data.remainingTime,
            results: data.results,
            totalVotes: data.totalVotes,
            hasVoted: data.hasVoted,
            isLoading: false,
        }));
    }, []);

    const handleResultsUpdate = useCallback((data: { pollId: string; results: VoteResult[]; totalVotes: number }) => {
        setState((prev) => {
            if (prev.poll?._id !== data.pollId) return prev;
            return { ...prev, results: data.results, totalVotes: data.totalVotes };
        });
    }, []);

    const handlePollEnded = useCallback((data: { pollId: string; results: VoteResult[]; totalVotes: number; auto: boolean }) => {
        setState((prev) => {
            if (!prev.poll) return prev;
            return {
                ...prev,
                poll: prev.poll ? { ...prev.poll, isActive: false } : null,
                results: data.results,
                totalVotes: data.totalVotes,
                remainingTime: 0,
            };
        });
        showToast(data.auto ? 'Poll time expired!' : 'Poll ended by teacher', 'info');
        onEvent?.('poll:ended', data);
    }, [showToast, onEvent]);

    const handleStudentRemoved = useCallback(({ studentName: removedName }: { studentName: string }) => {
        if (removedName === studentName) {
            showToast('You have been removed from this poll', 'error');
        }
    }, [studentName, showToast]);

    // ─── Vote submission with optimistic UI ──────────────
    const submitVote = useCallback(async (optionId: string, emitFn: (event: string, data: unknown, cb?: (res: unknown) => void) => void) => {
        if (!state.poll || state.hasVoted || votingRef.current) return;

        // Optimistic UI update
        votingRef.current = true;
        const prevState = state;
        setState((prev) => ({
            ...prev,
            hasVoted: true,
            selectedOptionId: optionId,
        }));

        emitFn('poll:vote', { pollId: state.poll._id, studentName, optionId }, (res: unknown) => {
            votingRef.current = false;
            const response = res as { success: boolean; message?: string; results?: VoteResult[] };
            if (!response.success) {
                // Rollback optimistic update
                setState(prevState);
                showToast(response.message || 'Failed to submit vote', 'error');
            }
        });
    }, [state, studentName, showToast]);

    // ─── Poll History ────────────────────────────────────
    const fetchHistory = useCallback(async (page = 1) => {
        setHistoryLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/polls/history?page=${page}&limit=10`);
            if (res.data.success) {
                setHistory(res.data.data.polls);
            }
        } catch {
            showToast('Failed to load poll history', 'error');
        } finally {
            setHistoryLoading(false);
        }
    }, [showToast]);

    return {
        state,
        setState,
        history,
        historyLoading,
        fetchHistory,
        submitVote,
        handlers: {
            handlePollNew,
            handlePollState,
            handleResultsUpdate,
            handlePollEnded,
            handleStudentRemoved,
        },
    };
};
