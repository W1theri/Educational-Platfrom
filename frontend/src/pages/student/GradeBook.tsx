import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface Assignment {
    _id: string;
    title: string;
    maxGrade: number;
    dueDate: string;
}

interface Lesson {
    _id: string;
    title: string;
    order: number;
}

interface Grade {
    _id: string;
    grade: number | null;
    status: 'not_submitted' | 'pending' | 'graded';
    lesson: Lesson;
    assignment: Assignment;
    submittedAt: string | null;
    gradedAt: string | null;
}

interface Course {
    _id: string;
    title: string;
    teacher: string;
}

interface GradeBookEntry {
    course: Course;
    enrolledAt: string;
    grades: Grade[];
}

const GradeBook: React.FC = () => {
    const navigate = useNavigate();
    const [gradebook, setGradebook] = useState<GradeBookEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

    useEffect(() => {
        const fetchGradebook = async () => {
            try {
                const response = await api.get('/grades/student/me/gradebook');
                setGradebook(response.data);
                if (response.data.length > 0) {
                    setSelectedCourse(response.data[0].course._id);
                }
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch gradebook');
            } finally {
                setLoading(false);
            }
        };
        fetchGradebook();
    }, []);

    const getStatusBadge = (grade: Grade) => {
        if (grade.status === 'graded' && grade.grade !== null) {
            return (
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                        {grade.grade}/{grade.assignment.maxGrade}
                    </span>
                    <span className="text-xs text-gray-500">✓ Graded</span>
                </div>
            );
        } else if (grade.status === 'pending') {
            return (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                    Pending
                </span>
            );
        } else {
            return (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">
                    ✗ Not submitted
                </span>
            );
        }
    };

    if (loading) return <div className="p-8 text-center">Loading gradebook...</div>;
    if (error) return <div className="p-8 text-red-600 text-center">{error}</div>;

    const selectedGradebookEntry = gradebook.find((entry) => entry.course._id === selectedCourse);

    return (
        <div className="max-w-6xl mx-auto mt-10 p-6">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Gradebook</h1>
                        <p className="text-gray-600">View grades across all courses</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-600 hover:text-indigo-600 font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {gradebook.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500">You are not enrolled in any courses yet</p>
                    </div>
                ) : (
                    <div>
                        {/* Course Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {gradebook.map((entry) => (
                                <button
                                    key={entry.course._id}
                                    onClick={() => setSelectedCourse(entry.course._id)}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${selectedCourse === entry.course._id
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {entry.course.title}
                                </button>
                            ))}
                        </div>

                        {/* Grades Table */}
                        {selectedGradebookEntry && (
                            <div>
                                {selectedGradebookEntry.grades.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                                        <p className="text-gray-500">This course has no assignments with grades yet</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                        Lesson
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                        Assignment
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                        Submission date
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                        Status/Grade
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedGradebookEntry.grades
                                                    .sort((a, b) => a.lesson.order - b.lesson.order)
                                                    .map((grade) => (
                                                        <tr
                                                            key={grade._id}
                                                            className="border-b border-gray-100 hover:bg-gray-50 transition"
                                                        >
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                                        {grade.lesson.order}
                                                                    </div>
                                                                    <span className="font-medium text-gray-900">
                                                                        {grade.lesson.title}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <p className="text-sm text-gray-700">
                                                                    {grade.assignment.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Due:{' '}
                                                                    {new Date(
                                                                        grade.assignment.dueDate
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <p className="text-sm text-gray-600">
                                                                    {grade.submittedAt
                                                                        ? new Date(
                                                                            grade.submittedAt
                                                                        ).toLocaleDateString()
                                                                        : '—'}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-4">{getStatusBadge(grade)}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Statistics */}
                                {selectedGradebookEntry.grades.length > 0 && (
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {selectedGradebookEntry.grades.length}
                                            </p>
                                            <p className="text-sm text-gray-600 font-semibold">Total Assignments</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-green-600">
                                                {
                                                    selectedGradebookEntry.grades.filter(
                                                        (g) => g.status === 'graded'
                                                    ).length
                                                }
                                            </p>
                                            <p className="text-sm text-gray-600 font-semibold">Graded</p>
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-amber-600">
                                                {
                                                    selectedGradebookEntry.grades.filter(
                                                        (g) => g.status === 'pending'
                                                    ).length
                                                }
                                            </p>
                                            <p className="text-sm text-gray-600 font-semibold">Under Review</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradeBook;
