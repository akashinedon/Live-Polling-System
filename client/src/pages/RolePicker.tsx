import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const RolePicker: React.FC = () => {
    const { setRole, setStudentName } = useApp();
    const [view, setView] = useState<'pick' | 'student-name'>('pick');
    const [nameInput, setNameInput] = useState('');
    const [error, setError] = useState('');

    const handleStudentContinue = () => {
        const name = nameInput.trim();
        if (!name) { setError('Please enter your name'); return; }
        if (name.length < 2) { setError('Name must be at least 2 characters'); return; }
        setStudentName(name);
        setRole('student');
    };

    if (view === 'student-name') {
        return (
            <div className="page-center">
                <div style={{ width: '100%', maxWidth: 440 }} className="animate-scaleIn">
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
                        <h1 style={{ marginBottom: '0.5rem' }}>
                            What's your <span className="text-gradient">name?</span>
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            Your name will be visible to the teacher
                        </p>
                    </div>
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <input
                                id="student-name-input"
                                className="input"
                                type="text"
                                placeholder="Enter your name"
                                value={nameInput}
                                autoFocus
                                onChange={(e) => { setNameInput(e.target.value); setError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleStudentContinue()}
                                style={{ textAlign: 'center', fontSize: '1.1rem' }}
                            />
                            {error && <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>{error}</p>}
                        </div>
                        <button
                            id="student-join-btn"
                            className="btn btn-primary btn-lg w-full"
                            onClick={handleStudentContinue}
                        >
                            Join Session →
                        </button>
                        <button
                            className="btn btn-ghost w-full"
                            style={{ marginTop: '0.75rem' }}
                            onClick={() => setView('pick')}
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-center">
            <div style={{ width: '100%', maxWidth: 600 }} className="animate-fadeIn">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🗳️</div>
                    <h1 style={{ marginBottom: '0.75rem' }}>
                        Live <span className="text-gradient">Poll</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-2)', fontSize: '1rem' }}>
                        Real-time interactive polling for your classroom
                    </p>
                </div>

                {/* Role cards */}
                <div className="grid-2">
                    <RoleCard
                        id="teacher-role-btn"
                        emoji="👨‍🏫"
                        title="I'm a Teacher"
                        description="Create polls and watch live results as students respond"
                        onClick={() => setRole('teacher')}
                        gradient="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                    />
                    <RoleCard
                        id="student-role-btn"
                        emoji="🎓"
                        title="I'm a Student"
                        description="Answer polls and see real-time results with your class"
                        onClick={() => setView('student-name')}
                        gradient="linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)"
                    />
                </div>
            </div>
        </div>
    );
};

const RoleCard: React.FC<{
    id: string;
    emoji: string;
    title: string;
    description: string;
    onClick: () => void;
    gradient: string;
}> = ({ id, emoji, title, description, onClick, gradient }) => (
    <button
        id={id}
        onClick={onClick}
        style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem 1.5rem',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            fontFamily: 'var(--font-family)',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.2)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
        }}>
            {emoji}
        </div>
        <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>{title}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{description}</div>
        </div>
        <div style={{ color: 'var(--color-primary-light)', fontSize: '0.85rem', fontWeight: 600 }}>
            Get Started →
        </div>
    </button>
);
