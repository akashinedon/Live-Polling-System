import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface ChatPopupProps {
    messages: ChatMessage[];
    onSend: (message: string) => void;
    name: string;
    role: 'teacher' | 'student';
}

export const ChatPopup: React.FC<ChatPopupProps> = ({ messages, onSend, name, role }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setUnread(0);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (messages.length > 0) {
            setUnread((p) => p + 1);
        }
    }, [messages, isOpen]);

    const send = () => {
        const msg = input.trim();
        if (!msg) return;
        onSend(msg);
        setInput('');
    };

    return (
        <>
            {/* Chat bubble button */}
            <button
                id="chat-toggle-btn"
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) setUnread(0); }}
                style={{
                    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
                    width: 56, height: 56,
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
                    zIndex: 1000,
                    fontSize: '1.4rem',
                    transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                💬
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: -4, right: -4,
                        background: 'var(--color-error)',
                        color: 'white', borderRadius: '50%',
                        width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700,
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {/* Chat window */}
            {isOpen && (
                <div style={{
                    position: 'fixed', bottom: '5rem', right: '1.5rem',
                    width: 'min(380px, calc(100vw - 3rem))',
                    height: 440,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex', flexDirection: 'column',
                    zIndex: 1000,
                    animation: 'scaleIn 0.2s ease',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '0.875rem 1rem',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Class Chat</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
                        >✕</button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', paddingTop: '2rem' }}>
                                No messages yet. Say hello! 👋
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isOwn = msg.name === name;
                            return (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                                    {!isOwn && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', paddingLeft: '0.5rem' }}>
                                            {msg.name} {msg.role === 'teacher' && '👨‍🏫'}
                                        </span>
                                    )}
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '0.5rem 0.875rem',
                                        borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                        background: isOwn ? 'var(--gradient-primary)' : 'var(--color-surface-3)',
                                        color: 'var(--color-text)',
                                        fontSize: '0.875rem',
                                        lineHeight: 1.4,
                                    }}>
                                        {msg.message}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem' }}>
                        <input
                            id="chat-input"
                            className="input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && send()}
                            placeholder="Type a message…"
                            style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.875rem', borderRadius: 'var(--radius-full)' }}
                        />
                        <button className="btn btn-primary btn-sm" onClick={send} style={{ borderRadius: 'var(--radius-full)', padding: '0.6rem 1rem' }}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
