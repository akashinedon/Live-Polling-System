import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
    startTime: number | null; // epoch ms from server
    duration: number | null;  // seconds
    onExpire?: () => void;
}

export const usePollTimer = ({ startTime, duration, onExpire }: UseTimerOptions) => {
    const [remainingTime, setRemainingTime] = useState<number>(0); // ms
    const [isExpired, setIsExpired] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!startTime || !duration) {
            setRemainingTime(0);
            setIsExpired(false);
            clearTimer();
            return;
        }

        const computeRemaining = () => {
            const endTime = startTime + duration * 1000;
            return Math.max(0, endTime - Date.now());
        };

        const initial = computeRemaining();
        setRemainingTime(initial);
        setIsExpired(initial <= 0);

        if (initial <= 0) {
            onExpireRef.current?.();
            return;
        }

        clearTimer();
        intervalRef.current = setInterval(() => {
            const rem = computeRemaining();
            setRemainingTime(rem);
            if (rem <= 0) {
                setIsExpired(true);
                clearTimer();
                onExpireRef.current?.();
            }
        }, 500); // Update every 500ms for smooth countdown

        return clearTimer;
    }, [startTime, duration, clearTimer]);

    const seconds = Math.ceil(remainingTime / 1000);
    const progress = duration ? Math.min(1, Math.max(0, remainingTime / (duration * 1000))) : 0;

    return { remainingTime, seconds, progress, isExpired };
};
