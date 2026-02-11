import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface Lesson {
    _id: string;
    title: string;
    order: number;
}

interface AssignmentOverview {
    assignmentId: string;
    assignmentTitle: string;
    lesson: Lesson;
    dueDate: string;
    maxGrade: number;
    stats: {
        total: number;
        graded: number;
        pending: number;
    };
}

const AssignmentsOverview: React.FC = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<AssignmentOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const response = await api.get(`/assignments/course/${courseId}/overview`);
                setAssignments(response.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch assignments');
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, [courseId]);

    if (loading) return <div className="p-8 text-center">Loading assignments...</div>;
    if (error) return <div className="p-8 text-red-600 text-center">{error}</div>;

    return (
        <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Assignments Overview</h1>
                    <p className="text-gray-500">Review and grade student submissions</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-600 hover:text-indigo-600 font-medium"
                >
                    ← Back
                </button>
            </div>

            {assignments.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">No assignments yet. Create assignments for your lesson to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment) => (
                        <div
                            key={assignment.assignmentId}
                            className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition cursor-pointer"
                            onClick={() => navigate(`/teacher/assignments/${assignment.assignmentId}/review`)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{assignment.assignmentTitle}</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Lesson {assignment.lesson.order}: {assignment.lesson.title}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-700">Due Date</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(assignment.dueDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-4">
                                <div className="flex-1 bg-blue-50 p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-blue-600">{assignment.stats.total}</p>
                                    <p className="text-xs text-gray-600 uppercase font-semibold">Total Submissions</p>
                                </div>
                                <div className="flex-1 bg-green-50 p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-600">{assignment.stats.graded}</p>
                                    <p className="text-xs text-gray-600 uppercase font-semibold">Graded</p>
                                </div>
                                <div className="flex-1 bg-amber-50 p-3 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-amber-600">{assignment.stats.pending}</p>
                                    <p className="text-xs text-gray-600 uppercase font-semibold">Pending</p>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button className="text-sm font-semibold text-indigo-600 hover:underline">
                                    Review Submissions →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssignmentsOverview;
