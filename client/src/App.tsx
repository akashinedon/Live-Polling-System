import React from 'react';
import { useApp } from './context/AppContext';
import { RolePicker } from './pages/RolePicker';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentView } from './pages/StudentView';

const App: React.FC = () => {
    const { role } = useApp();

    if (role === 'teacher') return <TeacherDashboard />;
    if (role === 'student') return <StudentView />;
    return <RolePicker />;
};

export default App;
