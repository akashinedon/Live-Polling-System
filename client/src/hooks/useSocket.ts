import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            setConnectionStatus('connected');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        socket.on('connect_error', () => {
            setConnectionStatus('disconnected');
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const emit = useCallback((event: string, data?: unknown, callback?: (res: unknown) => void) => {
        if (socketRef.current?.connected) {
            if (callback) {
                socketRef.current.emit(event, data, callback);
            } else {
                socketRef.current.emit(event, data);
            }
        }
    }, []);

    const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
        socketRef.current?.on(event, handler);
        return () => {
            socketRef.current?.off(event, handler);
        };
    }, []);

    const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
        socketRef.current?.off(event, handler);
    }, []);

    return { socket: socketRef.current, isConnected, connectionStatus, emit, on, off };
};
