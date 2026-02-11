import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Course {
    _id: string;
    title: string;
    description: string;
    teacher: { username: string };
    isPublic: boolean;
    category: string;
    level: string;
    duration: string;
}

const CourseDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [enrolled, setEnrolled] = useState(false);
    const [enrollmentKey, setEnrollmentKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);

                // Check if user is already enrolled
                const myCourses = await api.get('/courses/my/courses');
                const isEnrolled = myCourses.data.some((c: any) => c._id === id);
                setEnrolled(isEnrolled);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch course');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    const handleEnroll = async () => {
        if (!course?.isPublic && !enrollmentKey && !showKeyInput) {
            setShowKeyInput(true);
            return;
        }

        try {
            await api.post(`/courses/${id}/enroll`, { enrollmentKey });
            setEnrolled(true);
            alert('Successfully enrolled!');
            setShowKeyInput(false);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Enrollment failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-indigo-600 font-semibold text-xl animate-pulse">Loading course...</div>;
    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl max-w-md mx-auto mt-10 shadow-sm border border-red-100">{error}</div>;
    if (!course) return <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl max-w-md mx-auto mt-10 border border-gray-200">Course not found</div>;

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 mb-10">
            <button
                onClick={() => navigate(-1)}
                className="mb-8 text-indigo-600 hover:text-indigo-800 flex items-center gap-2 font-semibold transition-all group"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to selection
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{course.title}</h1>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${course.isPublic ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {course.isPublic ? 'Public Access' : 'Private Access'}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-xs text-indigo-500 uppercase font-bold mb-1">Instructor</p>
                    <p className="text-indigo-900 font-bold text-lg">{course.teacher.username}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <p className="text-xs text-purple-500 uppercase font-bold mb-1">Category</p>
                    <p className="text-purple-900 font-bold text-lg">{course.category}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-xs text-blue-500 uppercase font-bold mb-1">Level</p>
                    <p className="text-blue-900 font-bold text-lg">{course.level}</p>
                </div>
            </div>

            <div className="prose max-w-none mb-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Course Description</h2>
                <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">{course.description}</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-indigo-500/20 shadow-lg">
                        {course.duration ? '⏱️' : '🎓'}
                    </div>
                    <div>
                        <p className="text-gray-900 font-bold text-lg">{course.duration || 'Flexible Learning'}</p>
                        <p className="text-gray-500 text-sm italic">Self-paced curriculum</p>
                    </div>
                </div>

                {enrolled ? (
                    <button className="px-10 py-4 bg-green-600 text-white font-extrabold rounded-2xl hover:bg-green-700 shadow-xl shadow-green-500/30 transition-all active:scale-95 flex items-center gap-2">
                        <span className="text-xl">✅</span> Already Enrolled
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                        {showKeyInput && (
                            <input
                                type="text"
                                placeholder="Enter Enrollment Key"
                                className="px-4 py-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                value={enrollmentKey}
                                onChange={(e) => setEnrollmentKey(e.target.value)}
                            />
                        )}
                        <button
                            onClick={handleEnroll}
                            className="w-full md:w-auto px-12 py-4 bg-indigo-600 text-white font-extrabold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 transition-all active:scale-95 text-lg"
                        >
                            {showKeyInput ? 'Confirm & Join' : 'Enroll Now'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDetail;
