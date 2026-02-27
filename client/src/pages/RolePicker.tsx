import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const RolePicker: React.FC = () => {
    const { setRole, setStudentName } = useApp();
    const [view, setView] = useState<'pick' | 'student-name'>('pick');
    const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
    const [nameInput, setNameInput] = useState('');
    const [error, setError] = useState('');

    const handleContinue = () => {
        if (selectedRole === 'teacher') {
            setRole('teacher');
        } else if (selectedRole === 'student') {
            setView('student-name');
        }
    };

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
                <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }} className="animate-fadeIn">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <span className="intervue-badge">Intervue Poll</span>
                    </div>

                    <h1 style={{ marginBottom: '0.5rem' }}>
                        Let's <strong>Get Started</strong>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: 420, margin: '0 auto 2.5rem' }}>
                        If you're a student, you'll be able to <strong style={{ color: 'var(--color-text)' }}>submit your answers</strong>, participate in live polls, and see how your responses compare with your classmates
                    </p>

                    <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '0.5rem' }}>
                            Enter your Name
                        </label>
                        <input
                            id="student-name-input"
                            className="input"
                            type="text"
                            placeholder="Aakash Chauhan"
                            value={nameInput}
                            autoFocus
                            onChange={(e) => { setNameInput(e.target.value); setError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleStudentContinue()}
                        />
                        {error && <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
                    </div>

                    <button
                        id="student-join-btn"
                        className="btn btn-primary btn-lg"
                        onClick={handleStudentContinue}
                        style={{ minWidth: 200 }}
                    >
                        Continue
                    </button>

                    <div style={{ marginTop: '1rem' }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setView('pick')}
                            style={{ border: 'none', color: 'var(--color-text-muted)' }}
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
            <div style={{ width: '100%', maxWidth: 620, textAlign: 'center' }} className="animate-fadeIn">
                <div style={{ marginBottom: '1.5rem' }}>
                    <span className="intervue-badge">Intervue Poll</span>
                </div>

                <h1 style={{ marginBottom: '0.5rem' }}>
                    Welcome to the <strong>Live Polling System</strong>
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: 480, margin: '0 auto 2.5rem' }}>
                    Please select the role that best describes you to begin using the live polling system
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'nowrap' }}>
                    <button
                        id="student-role-btn"
                        className={`role-card${selectedRole === 'student' ? ' selected' : ''}`}
                        onClick={() => setSelectedRole('student')}
                        style={{ flex: 1, minWidth: 0 }}
                    >
                        <h4>I'm a Student</h4>
                        <p>Submit your answers and see how they compare with your classmates in real-time.</p>
                    </button>

                    <button
                        id="teacher-role-btn"
                        className={`role-card${selectedRole === 'teacher' ? ' selected' : ''}`}
                        onClick={() => setSelectedRole('teacher')}
                        style={{ flex: 1, minWidth: 0 }}
                    >
                        <h4>I'm a Teacher</h4>
                        <p>Create polls, ask questions, and monitor student responses live.</p>
                    </button>
                </div>

                <button
                    id="continue-btn"
                    className="btn btn-primary btn-lg"
                    onClick={handleContinue}
                    disabled={!selectedRole}
                    style={{ minWidth: 200 }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};
