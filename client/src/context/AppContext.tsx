import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppRole } from '../types';

interface AppContextValue {
    role: AppRole;
    setRole: (role: AppRole) => void;
    studentName: string;
    setStudentName: (name: string) => void;
    studentCount: number;
    setStudentCount: (count: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRoleState] = useState<AppRole>(() => {
        return (sessionStorage.getItem('role') as AppRole) || null;
    });
    const [studentName, setStudentNameState] = useState(() => {
        return sessionStorage.getItem('studentName') || '';
    });
    const [studentCount, setStudentCount] = useState(0);

    const setRole = useCallback((r: AppRole) => {
        setRoleState(r);
        if (r) sessionStorage.setItem('role', r);
        else sessionStorage.removeItem('role');
    }, []);

    const setStudentName = useCallback((name: string) => {
        setStudentNameState(name);
        if (name) sessionStorage.setItem('studentName', name);
        else sessionStorage.removeItem('studentName');
    }, []);

    return (
        <AppContext.Provider value={{ role, setRole, studentName, setStudentName, studentCount, setStudentCount }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};
