import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface Participant {
    socketId: string;
    name: string;
}

interface ChatPopupProps {
    messages: ChatMessage[];
    onSend: (message: string) => void;
    name: string;
    role: 'teacher' | 'student';
    participants?: Participant[];
    onKick?: (studentName: string) => void;
}

export const ChatPopup: React.FC<ChatPopupProps> = ({ messages, onSend, name, role, participants = [], onKick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
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
            {/* Chat FAB button */}
            <button
                id="chat-toggle-btn"
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) setUnread(0); }}
                style={{
                    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
                    width: 52, height: 52,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(108, 99, 255, 0.4)',
                    zIndex: 1000,
                    color: 'white',
                    fontSize: '1.2rem',
                    transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
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
                    width: 'min(360px, calc(100vw - 3rem))',
                    height: 420,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex', flexDirection: 'column',
                    zIndex: 1000,
                    animation: 'scaleIn 0.2s ease',
                    overflow: 'hidden',
                }}>
                    {/* Tabs: Chat | Participants */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid var(--color-border)',
                    }}>
                        <button
                            onClick={() => setActiveTab('chat')}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                border: 'none',
                                background: 'none',
                                fontFamily: 'var(--font-family)',
                                fontSize: '0.9rem',
                                fontWeight: activeTab === 'chat' ? 700 : 400,
                                color: activeTab === 'chat' ? 'var(--color-text)' : 'var(--color-text-muted)',
                                borderBottom: activeTab === 'chat' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('participants')}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                border: 'none',
                                background: 'none',
                                fontFamily: 'var(--font-family)',
                                fontSize: '0.9rem',
                                fontWeight: activeTab === 'participants' ? 700 : 400,
                                color: activeTab === 'participants' ? 'var(--color-text)' : 'var(--color-text-muted)',
                                borderBottom: activeTab === 'participants' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            Participants
                        </button>
                    </div>

                    {activeTab === 'chat' ? (
                        <>
                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {messages.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', paddingTop: '2rem' }}>
                                        No messages yet. Say hello! 👋
                                    </div>
                                )}
                                {messages.map((msg) => {
                                    const isOwn = msg.name === name;
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                color: isOwn ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                fontWeight: 600,
                                                marginBottom: '0.15rem',
                                                paddingLeft: isOwn ? 0 : '0.5rem',
                                                paddingRight: isOwn ? '0.5rem' : 0,
                                            }}>
                                                {msg.name} {msg.role === 'teacher' && '👨‍🏫'}
                                            </span>
                                            <div style={{
                                                maxWidth: '80%',
                                                padding: '0.5rem 0.875rem',
                                                borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                                background: isOwn ? 'var(--color-primary)' : 'var(--color-surface-2)',
                                                color: isOwn ? 'white' : 'var(--color-text)',
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
                        </>
                    ) : (
                        /* Participants tab */
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                            {/* Header row */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem 1rem',
                                borderBottom: '1px solid var(--color-border)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: 'var(--color-text-muted)',
                            }}>
                                <span>Name</span>
                                {role === 'teacher' && <span>Action</span>}
                            </div>

                            {participants.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', paddingTop: '2rem' }}>
                                    No participants yet
                                </div>
                            ) : (
                                participants.map((p) => (
                                    <div
                                        key={p.socketId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.6rem 1rem',
                                            borderBottom: '1px solid var(--color-surface-2)',
                                            transition: 'background 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>{p.name}</span>
                                        {role === 'teacher' && onKick && (
                                            <button
                                                onClick={() => onKick(p.name)}
                                                style={{
                                                    padding: '0.3rem 0.7rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: 'var(--color-error)',
                                                    cursor: 'pointer',
                                                    fontFamily: 'var(--font-family)',
                                                    transition: 'background 0.15s ease',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                                            >
                                                Kick
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
