import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface Comment {
    _id: string;
    author: {
        _id: string;
        username: string;
        role: string;
    };
    content: string;
    createdAt: string;
}

interface Submission {
    _id: string;
    student: string | {
        _id: string;
        username: string;
        email: string;
    };
    fileUrl?: string;
    filename?: string;
    content?: string;
    grade?: number | null;
    feedback?: string;
    comments: Comment[];
    submittedAt: string;
    isLate?: boolean;
    gradedAt?: string | null;
}

interface Assignment {
    _id: string;
    title: string;
    description: string;
    maxGrade: number;
    dueDate: string;
    submissions: Submission[];
    course?: string | { _id: string };
    lesson: {
        _id: string;
        title: string;
    };
}

interface EnrollmentStudent {
    _id: string;
    username: string;
    email: string;
}

interface CourseEnrollment {
    _id: string;
    student: EnrollmentStudent;
}

const SubmissionReview: React.FC = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [gradeInput, setGradeInput] = useState('');
    const [feedbackInput, setFeedbackInput] = useState('');
    const [commentInput, setCommentInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [studentInfoById, setStudentInfoById] = useState<Record<string, EnrollmentStudent>>({});
    const [isEditing, setIsEditing] = useState(false);

    const getStudentId = (submission: Submission) =>
        typeof submission.student === 'string' ? submission.student : submission.student._id;

    const getStudentName = (submission: Submission) =>
        typeof submission.student === 'string'
            ? (studentInfoById[submission.student]?.username || 'Student')
            : submission.student.username;

    const getStudentEmail = (submission: Submission) =>
        typeof submission.student === 'string'
            ? (studentInfoById[submission.student]?.email || '')
            : submission.student.email;

    const isSubmissionLate = (submission: Submission) => {
        if (typeof submission.isLate === 'boolean') return submission.isLate;
        return new Date(submission.submittedAt) > new Date(assignment?.dueDate || 0);
    };

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const response = await api.get(`/assignments/${assignmentId}`);
                setAssignment(response.data);

                const hasUnpopulatedStudents = response.data.submissions?.some(
                    (submission: Submission) => typeof submission.student === 'string'
                );
                const courseId =
                    typeof response.data.course === 'string'
                        ? response.data.course
                        : response.data.course?._id;

                if (hasUnpopulatedStudents && courseId) {
                    const enrollmentsRes = await api.get(`/courses/${courseId}/enrollments`);
                    const infoMap: Record<string, EnrollmentStudent> = {};
                    (enrollmentsRes.data as CourseEnrollment[]).forEach((enrollment) => {
                        if (enrollment.student?._id) {
                            infoMap[enrollment.student._id] = enrollment.student;
                        }
                    });
                    setStudentInfoById(infoMap);
                }

                if (response.data.submissions.length > 0) {
                    selectSubmission(response.data.submissions[0]);
                }
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch assignment');
            } finally {
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [assignmentId]);

    const selectSubmission = (submission: Submission) => {
        setSelectedSubmission(submission);
        setGradeInput(submission.grade?.toString() || '');
        setFeedbackInput(submission.feedback || '');
        setCommentInput('');
        setIsEditing(submission.grade === null || submission.grade === undefined);
    };

    const handleGradeSubmission = async () => {
        if (!selectedSubmission || !assignment) return;
        setSubmitting(true);
        try {
            const response = await api.put(`/assignments/${assignmentId}/grade`, {
                submissionId: selectedSubmission._id,
                studentId: getStudentId(selectedSubmission),
                grade: parseFloat(gradeInput),
                feedback: feedbackInput,
            });
            setAssignment(response.data);
            const updated = response.data.submissions.find(
                (s: Submission) => s._id === selectedSubmission._id
            );
            if (updated) selectSubmission(updated);
            alert('Grade submitted successfully!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to submit grade');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddComment = async () => {
        if (!selectedSubmission || !assignment || !commentInput.trim()) return;
        setSubmitting(true);
        try {
            const response = await api.post(`/assignments/${assignmentId}/comment`, {
                submissionId: selectedSubmission._id,
                content: commentInput,
            });
            setAssignment(response.data);
            const updated = response.data.submissions.find(
                (s: Submission) => s._id === selectedSubmission._id
            );
            if (updated) selectSubmission(updated);
            setCommentInput('');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-red-600 text-center">{error}</div>;
    if (!assignment) return null;

    return (
        <div className="max-w-7xl mx-auto mt-10 p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
                    <p className="text-gray-600">Lesson: {assignment.lesson.title}</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-600 hover:text-indigo-600 font-medium"
                >
                    ← Back
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Submissions List */}
                <div className="md:col-span-1 bg-white rounded-xl shadow-lg p-4 max-h-[800px] overflow-y-auto">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Submissions ({assignment.submissions.length})
                    </h2>
                    {assignment.submissions.length === 0 ? (
                        <p className="text-gray-500 text-sm">No submissions yet</p>
                    ) : (
                        <div className="space-y-2">
                            {assignment.submissions.map((submission) => (
                                <div
                                    key={submission._id}
                                    onClick={() => selectSubmission(submission)}
                                    className={`p-3 rounded-lg border cursor-pointer transition ${selectedSubmission?._id === submission._id
                                        ? 'bg-indigo-50 border-indigo-300'
                                        : 'bg-gray-50 border-gray-200 hover:border-indigo-200'
                                        }`}
                                >
                                    <p className="font-semibold text-gray-900 text-sm">
                                        {getStudentName(submission)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(submission.submittedAt).toLocaleDateString()}
                                    </p>
                                    {isSubmissionLate(submission) && (
                                        <div className="mt-2 inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                                            Late
                                        </div>
                                    )}
                                    {submission.grade !== null && submission.grade !== undefined ? (
                                        <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                                            ✓ Graded: {submission.grade}/{assignment.maxGrade}
                                        </div>
                                    ) : (
                                        <div className="mt-2 inline-block px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                                            Pending
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submission Details */}
                <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6">
                    {selectedSubmission ? (
                        <div>
                            <div className="mb-6 pb-4 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {getStudentName(selectedSubmission)}
                                </h2>
                                <p className="text-sm text-gray-600">{getStudentEmail(selectedSubmission)}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                                </p>
                                {isSubmissionLate(selectedSubmission) && (
                                    <p className="text-xs text-red-700 font-bold mt-1">Late submission</p>
                                )}
                            </div>

                            {/* Submitted Work */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-3">Submitted Work</h3>
                                {selectedSubmission.fileUrl && (
                                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Attached File:</p>
                                        <a
                                            href={selectedSubmission.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline text-sm"
                                        >
                                            📎 {selectedSubmission.filename || 'Download File'}
                                        </a>
                                    </div>
                                )}
                                {selectedSubmission.content && (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                            {selectedSubmission.content}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-3">Comments</h3>
                                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                    {selectedSubmission.comments.map((comment) => (
                                        <div key={comment._id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {comment.author.username}
                                                    {comment.author.role && (
                                                        <span className="ml-2 text-xs font-normal text-gray-500">
                                                            ({comment.author.role})
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={submitting || !commentInput.trim()}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>

                            {/* Grading Section */}
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-bold text-gray-800">Grading</h3>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-sm text-indigo-600 font-bold hover:underline"
                                        >
                                            Edit Grade
                                        </button>
                                    )}
                                </div>

                                {!isEditing ? (
                                    <div className="bg-white p-4 rounded-xl border border-indigo-100">
                                        <div className="mb-4">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grade</span>
                                            <p className="text-3xl font-bold text-indigo-600 mt-1">
                                                {gradeInput} <span className="text-lg text-gray-400 font-medium">/ {assignment.maxGrade}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Feedback</span>
                                            <p className="text-gray-700 whitespace-pre-wrap mt-2 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                {feedbackInput || <span className="italic text-gray-400">No feedback provided.</span>}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Grade (Max: {assignment.maxGrade})
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={assignment.maxGrade}
                                                value={gradeInput}
                                                onChange={(e) => setGradeInput(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Feedback
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={feedbackInput}
                                                onChange={(e) => setFeedbackInput(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="Provide feedback for the student..."
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedSubmission.grade !== null && selectedSubmission.grade !== undefined && (
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="flex-1 bg-white text-gray-600 font-bold py-2 rounded-lg hover:bg-gray-50 transition border border-gray-200"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                onClick={handleGradeSubmission}
                                                disabled={submitting || !gradeInput}
                                                className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                {submitting ? 'Submitting...' : 'Submit Grade'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Select a submission to review
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionReview;
