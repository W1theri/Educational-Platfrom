import React from 'react';
import { useAuth } from '../context/AuthContext';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-indigo-600">EduPlatform</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">
                                {user?.username} <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase ml-1">{user?.role}</span>
                            </span>
                            <button
                                onClick={logout}
                                className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 hover:text-red-700 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {user?.role === 'teacher' || user?.role === 'admin' ? (
                    <TeacherDashboard />
                ) : (
                    <StudentDashboard />
                )}
            </main>
        </div>
    );
};

export default Dashboard;
