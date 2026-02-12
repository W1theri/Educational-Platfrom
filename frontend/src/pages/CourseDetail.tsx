import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Attachment {
    _id: string;
    filename: string;
    fileUrl: string;
    mimetype: string;
    size: number;
}

interface Lesson {
    _id: string;
    title: string;
    content: string;
    videoUrls: string[];
    attachments: Attachment[];
    order: number;
    isCompleted?: boolean;
    isAssignment?: boolean;
    dueDate?: string;
    maxGrade?: number;
}

interface Submission {
    _id: string;
    student: string;
    content?: string;
    fileUrl?: string;
    filename?: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
}

interface Assignment {
    _id: string;
    title: string;
    lesson: string;
    dueDate: string;
    maxGrade: number;
    submissions: Submission[];
}

interface Enrollment {
    _id: string;
    progress: number;
    completedLessons: string[];
}

interface Course {
    _id: string;
    title: string;
    description: string;
    teacher: { _id: string, username: string };
    isPublic: boolean;
    category: string;
    level: string;
    duration: string;
}

const CourseDetail: React.FC = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [enrolled, setEnrolled] = useState(false);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [enrollmentKey, setEnrollmentKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    // Assignment submission states
    const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
    const [submissionContent, setSubmissionContent] = useState<Record<string, string>>({});
    const [submissionFiles, setSubmissionFiles] = useState<Record<string, File | null>>({});
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);

                // Check if user is already enrolled
                const myCourses = await api.get('/courses/my/courses');
                const isEnrolled = myCourses.data.some((c: any) => c._id === id);
                setEnrolled(isEnrolled);

                // If enrolled or teacher, fetch lessons
                const isTeacher = response.data.teacher._id === user?._id;
                if (isEnrolled || isTeacher) {
                    const [lessonsRes, myCoursesRes] = await Promise.all([
                        api.get(`/courses/${id}/lessons`),
                        api.get('/courses/my/courses')
                    ]);

                    const currentCourseEnrollment = myCoursesRes.data.find((c: any) => c._id === id);
                    if (currentCourseEnrollment) {
                        setEnrollment({
                            _id: currentCourseEnrollment.enrollmentId,
                            progress: currentCourseEnrollment.progress,
                            completedLessons: [], // We'll need to fetch full enrollment for actual IDs usually, but my/courses might not have them.
                        });

                        // Let's fetch full enrollment details if student
                        if (user?.role === 'student') {
                            const fullEnrollRes = await api.get(`/courses/${id}/enrollment`); // Assuming this exists or we need to add it
                            // If it doesn't exist, we can manage with what we have if we update getLessons to include completion
                            setEnrollment({
                                _id: currentCourseEnrollment.enrollmentId,
                                progress: currentCourseEnrollment.progress,
                                completedLessons: fullEnrollRes.data.completedLessons || []
                            });
                        }
                    }

                    setLessons(lessonsRes.data);

                    // Fetch assignments for lessons that are assignments
                    const assignmentLessons = lessonsRes.data.filter((l: Lesson) => l.isAssignment);
                    if (assignmentLessons.length > 0) {
                        const assignmentPromises = assignmentLessons.map((l: Lesson) =>
                            api.get(`/assignments/lesson/${l._id}`).catch(() => null)
                        );
                        const assignmentResults = await Promise.all(assignmentPromises);
                        const assignmentMap: Record<string, Assignment> = {};
                        assignmentResults.forEach((res, idx) => {
                            if (res?.data) {
                                assignmentMap[assignmentLessons[idx]._id] = res.data;
                            }
                        });
                        setAssignments(assignmentMap);
                    }
                }
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch course');
            } finally {
                setLoading(false);
            }
        };
        fetchCourseData();
    }, [id, user]);

    const handleToggleComplete = async (lessonId: string) => {
        try {
            const response = await api.post(`/lessons/${lessonId}/complete`);
            setEnrollment(prev => prev ? {
                ...prev,
                completedLessons: response.data.completedLessons,
                progress: response.data.progress
            } : null);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update progress');
        }
    };

    const handleSubmitAssignment = async (lessonId: string, assignmentId: string) => {
        try {
            setSubmitting(prev => ({ ...prev, [lessonId]: true }));

            const formData = new FormData();
            const content = submissionContent[lessonId];
            const file = submissionFiles[lessonId];

            if (content) formData.append('content', content);
            if (file) {
                formData.append('file', file);
                formData.append('filename', file.name);
            }

            await api.post(`/assignments/${assignmentId}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Refresh assignment data
            const updatedAssignment = await api.get(`/assignments/lesson/${lessonId}`);
            setAssignments(prev => ({ ...prev, [lessonId]: updatedAssignment.data }));

            setSubmissionContent(prev => ({ ...prev, [lessonId]: '' }));
            setSubmissionFiles(prev => ({ ...prev, [lessonId]: null }));

            alert('Assignment submitted successfully!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to submit assignment');
        } finally {
            setSubmitting(prev => ({ ...prev, [lessonId]: false }));
        }
    };

    const getStudentSubmission = (assignment: Assignment): Submission | undefined => {
        return assignment.submissions.find(s => s.student === user?._id);
    };

    const handleEnroll = async () => {
        if (!course?.isPublic && !enrollmentKey && !showKeyInput) {
            setShowKeyInput(true);
            return;
        }

        try {
            await api.post(`/courses/${id}/enroll`, { enrollmentKey });
            setEnrolled(true);

            // Fetch lessons after enrollment
            const lessonsRes = await api.get(`/courses/${id}/lessons`);
            setLessons(lessonsRes.data);

            alert('Successfully enrolled!');
            setShowKeyInput(false);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Enrollment failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-indigo-600 font-semibold text-xl animate-pulse">Loading course...</div>;
    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl max-w-md mx-auto mt-10 shadow-sm border border-red-100">{error}</div>;
    if (!course) return <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl max-w-md mx-auto mt-10 border border-gray-200">Course not found</div>;

    const isOwner = user?._id === course.teacher._id;

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 mb-10">
            <div className="flex justify-between items-start mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 font-semibold transition-all group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
                </button>
                {isOwner && (
                    <Link
                        to={`/teacher/manage-course/${course._id}`}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 font-bold"
                    >
                        Manage Course
                    </Link>
                )}
            </div>

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

            {enrolled || isOwner ? (
                <div className="mt-10 animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-3xl"></span> Course Materials
                        </div>
                        {user?.role === 'student' && enrollment && (
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-sm font-bold text-indigo-600">{enrollment.progress}% Completed</span>
                                <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                    <div
                                        className="h-full bg-indigo-600 transition-all duration-500"
                                        style={{ width: `${enrollment.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </h2>
                    {lessons.length === 0 ? (
                        <div className="bg-gray-50 p-8 rounded-3xl text-center border border-gray-100">
                            <p className="text-gray-500 italic">No lessons have been added to this course yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {lessons.map((lesson) => {
                                const assignment = assignments[lesson._id];
                                const studentSubmission = assignment ? getStudentSubmission(assignment) : undefined;

                                return (
                                    <div key={lesson._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100 group">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                                <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold shadow-inner">
                                                    {lesson.order}
                                                </span>
                                                {lesson.title}
                                                {lesson.isAssignment && (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                                        Assignment
                                                    </span>
                                                )}
                                            </h3>
                                            {user?.role === 'student' && (
                                                <button
                                                    onClick={() => handleToggleComplete(lesson._id)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${enrollment?.completedLessons.includes(lesson._id)
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-gray-50 text-gray-400 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                                        }`}
                                                >
                                                    {enrollment?.completedLessons.includes(lesson._id) ? 'Completed' : 'Mark as Done'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-gray-600 prose prose-sm max-w-none mb-6 whitespace-pre-wrap leading-relaxed">
                                            {lesson.content}
                                        </div>

                                        {lesson.videoUrls && lesson.videoUrls.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">External Materials & Links</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {lesson.videoUrls.map((url, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition shadow-sm border border-indigo-100"
                                                        >
                                                            <span className="text-lg">🔗</span> Link {lesson.videoUrls.length > 1 ? idx + 1 : ''}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {lesson.attachments && lesson.attachments.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Downloads & Materials</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {lesson.attachments.map((file) => (
                                                        <a
                                                            key={file._id}
                                                            href={file.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-100 transition border border-indigo-100"
                                                        >
                                                            <span className="text-xl">📎</span>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm">{file.filename}</p>
                                                                <p className="text-[10px] text-indigo-400 uppercase font-bold">{file.mimetype.split('/')[1]}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Assignment Submission Section */}
                                        {lesson.isAssignment && assignment && user?.role === 'student' && (
                                            <div className="mt-6 pt-6 border-t border-gray-100">
                                                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                                    <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                                                        <span>📤</span> Submission Status
                                                    </h4>

                                                    {studentSubmission ? (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-amber-700 font-semibold px-3 py-1 bg-white rounded-full border border-amber-200">
                                                                    Submitted on {new Date(studentSubmission.submittedAt).toLocaleDateString()}
                                                                </span>
                                                                {studentSubmission.grade !== undefined && studentSubmission.grade !== null ? (
                                                                    <span className="text-lg font-bold text-indigo-600">
                                                                        Grade: {studentSubmission.grade}/{assignment.maxGrade}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm text-amber-600 font-bold animate-pulse">Pending Review</span>
                                                                )}
                                                            </div>
                                                            {studentSubmission.filename && (
                                                                <p className="text-sm text-gray-600 italic">Attached: {studentSubmission.filename}</p>
                                                            )}
                                                            {studentSubmission.feedback && (
                                                                <div className="bg-white p-4 rounded-xl border border-amber-100 mt-2">
                                                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Teacher Feedback</p>
                                                                    <p className="text-sm text-gray-700">{studentSubmission.feedback}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <p className="text-sm text-amber-800">Please upload your work for this lesson. Max grade: {assignment.maxGrade}. Due by: {new Date(assignment.dueDate).toLocaleString()}</p>
                                                            <textarea
                                                                placeholder="Add some notes for your teacher (optional)..."
                                                                className="w-full border border-amber-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-amber-300"
                                                                rows={3}
                                                                value={submissionContent[lesson._id] || ''}
                                                                onChange={(e) => setSubmissionContent(prev => ({ ...prev, [lesson._id]: e.target.value }))}
                                                            />
                                                            <div className="flex flex-col sm:flex-row gap-3">
                                                                <input
                                                                    type="file"
                                                                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                                                                    onChange={(e) => setSubmissionFiles(prev => ({ ...prev, [lesson._id]: e.target.files?.[0] || null }))}
                                                                />
                                                                <button
                                                                    onClick={() => handleSubmitAssignment(lesson._id, assignment._id)}
                                                                    disabled={submitting[lesson._id] || (!submissionFiles[lesson._id] && !submissionContent[lesson._id])}
                                                                    className="px-6 py-2 bg-amber-600 text-white font-bold rounded-full hover:bg-amber-700 transition shadow-lg shadow-amber-600/20 disabled:opacity-50 disabled:shadow-none"
                                                                >
                                                                    {submitting[lesson._id] ? 'Submitting...' : 'Upload Work'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-indigo-500/20 shadow-lg">
                            {course.duration ? '⏱️' : '🎓'}
                        </div>
                        <div>
                            <p className="text-gray-900 font-bold text-lg">{course.duration || 'Flexible Learning'}</p>
                            <p className="text-gray-500 text-sm italic">Enroll to access full curriculum</p>
                        </div>
                    </div>

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
                </div>
            )}
        </div>
    );
};

export default CourseDetail;

