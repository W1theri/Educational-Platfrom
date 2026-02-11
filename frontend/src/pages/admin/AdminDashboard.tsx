import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

interface User {
    _id: string;
    username: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    phoneNumber?: string;
}

interface CourseAnalytic {
    _id: string;
    title: string;
    teacher: string;
    studentCount: number;
    students: {
        username: string;
        email: string;
        progress: number;
        status: string;
        enrolledAt: string;
    }[];
}

interface Stats {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    averageProgress: number;
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'courses' | 'teachers' | 'students' | 'engagement'>('engagement');
    const [stats, setStats] = useState<Stats | null>(null);
    const [courses, setCourses] = useState<CourseAnalytic[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

    // Edit Modal State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ username: '', email: '', role: '', phoneNumber: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'engagement') {
                const res = await api.get('/admin/stats');
                setStats(res.data);
            } else if (activeTab === 'courses') {
                const res = await api.get('/admin/analytics/courses');
                setCourses(res.data);
            } else if (activeTab === 'teachers') {
                const res = await api.get('/users?role=teacher');
                setUsers(res.data);
            } else if (activeTab === 'students') {
                const res = await api.get('/users?role=student');
                setUsers(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (userId: string) => {
        const newPassword = prompt('Enter new password (min 6 chars):');
        if (!newPassword || newPassword.length < 6) return;
        try {
            await api.put(`/users/${userId}/reset-password`, { password: newPassword });
            alert('Password reset successfully');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to reset password');
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setEditForm({
            username: user.username,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber || ''
        });
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            await api.put(`/users/${editingUser._id}/admin`, editForm);
            alert('User updated successfully');
            setEditingUser(null);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update user');
        }
    };

    if (loading && !stats && courses.length === 0 && users.length === 0) {
        return <div className="p-8 text-center text-indigo-600 font-bold animate-pulse">Loading Admin Dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto mt-10 p-6 bg-gray-50 border border-gray-100 min-h-screen">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">Admin Control Center</h1>

            {/* Tabs */}
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-2xl">
                {(['engagement', 'courses', 'teachers', 'students'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all capitalize ${activeTab === tab
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Section */}
            <div className="animate-fade-in">
                {activeTab === 'engagement' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Students" value={stats.totalStudents} color="blue" icon="🎓" />
                        <StatCard title="Total Teachers" value={stats.totalTeachers} color="purple" icon="👨‍🏫" />
                        <StatCard title="Total Courses" value={stats.totalCourses} color="green" icon="📚" />
                        <StatCard title="Avg. Progress" value={`${stats.averageProgress}%`} color="amber" icon="📈" />
                    </div>
                )}

                {activeTab === 'courses' && (
                    <div className="space-y-4">
                        {courses.map(course => (
                            <div key={course._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div
                                    className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                                    onClick={() => setExpandedCourse(expandedCourse === course._id ? null : course._id)}
                                >
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                                        <p className="text-sm text-gray-500">Instructor: <span className="font-semibold text-indigo-600">{course.teacher}</span></p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-900">{course.studentCount}</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Students</p>
                                        </div>
                                        <span className={`transform transition-transform duration-300 ${expandedCourse === course._id ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </div>
                                </div>
                                {expandedCourse === course._id && (
                                    <div className="px-6 pb-6 pt-2 border-t border-gray-50 bg-gray-50/50">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Student Progress</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-xs text-gray-400 font-bold uppercase border-b border-gray-100">
                                                        <th className="pb-2">Student</th>
                                                        <th className="pb-2">Progress</th>
                                                        <th className="pb-2">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {course.students.map((student, idx) => (
                                                        <tr key={idx} className="group hover:bg-white transition">
                                                            <td className="py-3">
                                                                <p className="font-bold text-gray-800">{student.username}</p>
                                                                <p className="text-xs text-gray-500">{student.email}</p>
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-green-500" style={{ width: `${student.progress}%` }}></div>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-gray-700">{student.progress}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3">
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${student.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                                    }`}>
                                                                    {student.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {course.students.length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="py-4 text-center text-gray-400 italic text-sm">No students enrolled yet.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {(activeTab === 'students' || activeTab === 'teachers') && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Phone</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{user.username}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.phoneNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                                    title="Edit User"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user._id)}
                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition"
                                                    title="Reset Password"
                                                >
                                                    🔑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">No {activeTab} found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="bg-indigo-600 p-6 text-white">
                            <h3 className="text-xl font-bold">Edit User Details</h3>
                            <p className="text-indigo-100 text-sm">Update information for {editingUser.username}</p>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Username</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editForm.username}
                                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Role</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={editForm.phoneNumber}
                                    onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: string | number, color: string, icon: string }> = ({ title, value, color, icon }) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };

    return (
        <div className={`p-6 rounded-3xl border shadow-sm ${colors[color]}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-3xl">{icon}</span>
            </div>
            <p className="text-3xl font-black mb-1">{value}</p>
            <p className="text-xs uppercase font-extrabold tracking-widest opacity-80">{title}</p>
        </div>
    );
};

export default AdminDashboard;
