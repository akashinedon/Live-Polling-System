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
    const isVotingInProgress = useRef(false);

    useEffect(() => {
        const fetchActivePoll = async () => {
            try {
                const params = studentName ? `?studentName=${encodeURIComponent(studentName)}` : '';
                const res = await axios.get(`${API_BASE}/polls/active${params}`);
                if (res.data.success && res.data.data) {
                    const data = res.data.data;
                    setState((prev) => ({
                        ...prev,
                        poll: data,
                        remainingTime: data.remainingTime,
                        results: data.results || [],
                        totalVotes: data.totalVotes || 0,
                        hasVoted: data.hasVoted || false,
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

    const submitVote = useCallback(async (optionId: string, emitFn: (event: string, data: unknown, cb?: (res: unknown) => void) => void) => {
        if (!state.poll || state.hasVoted || isVotingInProgress.current) return;

        isVotingInProgress.current = true;
        const previousState = state;
        setState((prev) => ({
            ...prev,
            hasVoted: true,
            selectedOptionId: optionId,
        }));

        emitFn('poll:vote', { pollId: state.poll._id, studentName, optionId }, (res: unknown) => {
            isVotingInProgress.current = false;
            const response = res as { success: boolean; message?: string; results?: VoteResult[] };
            if (!response.success) {
                setState(previousState);
                showToast(response.message || 'Failed to submit vote', 'error');
            }
        });
    }, [state, studentName, showToast]);

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
