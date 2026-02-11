import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface Attachment {
    _id: string;
    filename: string;
    fileUrl: string;
}

interface Lesson {
    _id: string;
    title: string;
    content: string;
    videoUrls: string[];
    attachments: Attachment[];
    order: number;
    isPublished: boolean;
    isAssignment?: boolean;
    dueDate?: string;
    maxGrade?: number;
}

interface Course {
    _id: string;
    title: string;
}

const ManageCourse: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state for lesson
    const [lessonData, setLessonData] = useState({
        title: '',
        content: '',
        videoUrls: [''],
        order: 0,
        isPublished: true,
        isAssignment: false,
        dueDate: '',
        maxGrade: 100
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [courseRes, lessonsRes] = await Promise.all([
                    api.get(`/courses/${id}`),
                    api.get(`/courses/${id}/lessons`)
                ]);
                setCourse(courseRes.data);
                setLessons(lessonsRes.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleVideoUrlChange = (index: number, value: string) => {
        const newUrls = [...lessonData.videoUrls];
        newUrls[index] = value;
        setLessonData({ ...lessonData, videoUrls: newUrls });
    };

    const addVideoUrl = () => {
        setLessonData({ ...lessonData, videoUrls: [...lessonData.videoUrls, ''] });
    };

    const removeVideoUrl = (index: number) => {
        const newUrls = [...lessonData.videoUrls];
        newUrls.splice(index, 1);
        setLessonData({ ...lessonData, videoUrls: newUrls });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleSubmitLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', lessonData.title);
            formData.append('content', lessonData.content);
            formData.append('courseId', id || '');
            formData.append('order', lessonData.order.toString());
            formData.append('isPublished', lessonData.isPublished.toString());
            formData.append('isAssignment', lessonData.isAssignment.toString());

            if (lessonData.isAssignment) {
                formData.append('dueDate', lessonData.dueDate);
                formData.append('maxGrade', lessonData.maxGrade.toString());
            }

            lessonData.videoUrls.forEach(url => {
                if (url.trim()) formData.append('videoUrls', url);
            });

            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            if (editingLessonId) {
                const response = await api.put(`/lessons/${editingLessonId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setLessons(lessons.map(l => l._id === editingLessonId ? response.data : l).sort((a, b) => a.order - b.order));
            } else {
                const response = await api.post('/lessons', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setLessons([...lessons, response.data].sort((a, b) => a.order - b.order));
            }

            setLessonData({ title: '', content: '', videoUrls: [''], order: lessons.length + 1, isPublished: true, isAssignment: false, dueDate: '', maxGrade: 100 });
            setSelectedFiles([]);
            setShowForm(false);
            setEditingLessonId(null);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save lesson');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditLesson = (lesson: Lesson) => {
        setLessonData({
            title: lesson.title,
            content: lesson.content,
            videoUrls: lesson.videoUrls.length > 0 ? lesson.videoUrls : [''],
            order: lesson.order,
            isPublished: lesson.isPublished,
            isAssignment: lesson.isAssignment || false,
            dueDate: lesson.dueDate ? new Date(lesson.dueDate).toISOString().slice(0, 16) : '',
            maxGrade: lesson.maxGrade || 100
        });
        setEditingLessonId(lesson._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!window.confirm('Delete this lesson?')) return;
        try {
            await api.delete(`/lessons/${lessonId}`);
            setLessons(lessons.filter(l => l._id !== lessonId));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete lesson');
        }
    };

    if (loading) return <div className="p-8 text-center text-indigo-600 font-bold animate-pulse">Loading course data...</div>;
    if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-xl max-w-md mx-auto mt-10 text-center border border-red-100">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 mb-20">
            <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Manage Course</h1>
                    <p className="text-indigo-600 font-bold mt-1 text-lg">{course?.title}</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-50 text-gray-600 px-6 py-2 rounded-xl hover:bg-gray-100 transition font-bold border border-gray-200"
                >
                    ← Back
                </button>
            </div>

            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <span className="text-3xl">📖</span> Lessons List
                </h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/teacher/courses/${id}/assignments`)}
                        className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl hover:bg-amber-200 transition font-extrabold shadow-sm flex items-center gap-2 border border-amber-200"
                    >
                        <span>📋</span> Review Assignments
                    </button>
                    <button
                        onClick={() => {
                            if (showForm && editingLessonId) {
                                setEditingLessonId(null);
                                setLessonData({ title: '', content: '', videoUrls: [''], order: lessons.length + 1, isPublished: true, isAssignment: false, dueDate: '', maxGrade: 100 });
                            } else {
                                setShowForm(!showForm);
                            }
                        }}
                        className={`${showForm ? 'bg-gray-100 text-gray-600' : 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg'} px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all font-extrabold flex items-center gap-2`}
                    >
                        {showForm ? '✕ Close Form' : '＋ Add New Lesson'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="mb-12 p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100 animate-slide-down">
                    <h3 className="text-2xl font-bold mb-6 text-indigo-900 flex items-center gap-2">
                        {editingLessonId ? '✏️ Edit Lesson' : '✨ Create New Lesson'}
                    </h3>
                    <form onSubmit={handleSubmitLesson} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">Lesson Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Introduction to React"
                                    className="w-full px-4 py-3 bg-white border-2 border-indigo-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                    value={lessonData.title}
                                    onChange={e => setLessonData({ ...lessonData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">Display Order</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-white border-2 border-indigo-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                    value={lessonData.order}
                                    onChange={e => setLessonData({ ...lessonData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">Lesson Content (Markdown Supported) *</label>
                            <textarea
                                required
                                rows={6}
                                placeholder="Describe the lesson topics..."
                                className="w-full px-4 py-3 bg-white border-2 border-indigo-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                value={lessonData.content}
                                onChange={e => setLessonData({ ...lessonData, content: e.target.value })}
                            />
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <label className="block text-sm font-bold text-indigo-700 mb-4 uppercase tracking-wide">Resources & Links</label>
                            {lessonData.videoUrls.map((url, index) => (
                                <div key={index} className="flex gap-3 mb-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔗</span>
                                        <input
                                            type="url"
                                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-50 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm"
                                            value={url}
                                            onChange={e => handleVideoUrlChange(index, e.target.value)}
                                            placeholder="https://youtube.com/..."
                                        />
                                    </div>
                                    {lessonData.videoUrls.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVideoUrl(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addVideoUrl}
                                className="text-sm text-indigo-600 font-extrabold hover:text-indigo-800 flex items-center gap-1 group"
                            >
                                <span className="text-lg group-hover:rotate-90 transition-transform">＋</span> Add another resource link
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                            <label className="block text-sm font-bold text-indigo-700 mb-4 uppercase tracking-wide">Attach Files (PDF, ZIP, Images...)</label>
                            <div className="flex flex-col gap-4">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-extrabold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:transition-colors cursor-pointer"
                                />
                                {selectedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFiles.map((file, i) => (
                                            <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 font-bold">
                                                📎 {file.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-2xl border-2 border-indigo-50 shadow-inner">
                            <div className="flex items-center gap-3">
                                <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200 transition-colors has-[:checked]:bg-green-500">
                                    <input
                                        type="checkbox"
                                        id="isPublished"
                                        className="peer sr-only"
                                        checked={lessonData.isPublished}
                                        onChange={e => setLessonData({ ...lessonData, isPublished: e.target.checked })}
                                    />
                                    <label htmlFor="isPublished" className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-6 cursor-pointer"></label>
                                </div>
                                <label htmlFor="isPublished" className="text-sm font-bold text-gray-700 cursor-pointer">Live / Published Status</label>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200 transition-colors has-[:checked]:bg-amber-500">
                                    <input
                                        type="checkbox"
                                        id="isAssignment"
                                        className="peer sr-only"
                                        checked={lessonData.isAssignment}
                                        onChange={e => setLessonData({ ...lessonData, isAssignment: e.target.checked })}
                                    />
                                    <label htmlFor="isAssignment" className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-6 cursor-pointer"></label>
                                </div>
                                <label htmlFor="isAssignment" className="text-sm font-bold text-indigo-700 cursor-pointer">📋 Маркировать как задание (Assignment)</label>
                            </div>
                        </div>

                        {lessonData.isAssignment && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-amber-50/50 rounded-2xl border-2 border-amber-100 animate-fade-in shadow-inner">
                                <div>
                                    <label className="block text-sm font-bold text-amber-800 mb-2 uppercase tracking-wide">Deadline (Due Date)</label>
                                    <input
                                        type="datetime-local"
                                        value={lessonData.dueDate}
                                        onChange={e => setLessonData({ ...lessonData, dueDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border-2 border-amber-100 rounded-xl focus:border-amber-500 outline-none transition-all font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-amber-800 mb-2 uppercase tracking-wide">Maximum Possible Points</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={lessonData.maxGrade}
                                        onChange={e => setLessonData({ ...lessonData, maxGrade: parseInt(e.target.value) || 100 })}
                                        className="w-full px-4 py-3 bg-white border-2 border-amber-100 rounded-xl focus:border-amber-500 outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-indigo-600 text-white py-4 px-8 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 disabled:bg-gray-400 font-extrabold text-lg uppercase tracking-widest"
                        >
                            {submitting ? 'Saving changes...' : (editingLessonId ? 'Update Lesson' : 'Create Lesson')}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {lessons.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3rem]">
                        <p className="text-gray-400 text-xl font-medium">No lessons yet. Start by adding your first lesson!</p>
                    </div>
                ) : (
                    lessons.map((lesson) => (
                        <div key={lesson._id} className="flex justify-between items-center p-6 bg-white rounded-3xl border border-gray-100 hover:border-indigo-100 hover:shadow-xl transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">
                                    {lesson.order}
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-3">
                                        {lesson.title}
                                        {lesson.isAssignment && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                                📋 Assignment
                                            </span>
                                        )}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm border ${lesson.isPublished ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {lesson.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                        {lesson.videoUrls?.filter(u => u.trim()).length > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black uppercase tracking-tighter border border-blue-100 shadow-sm">🔗 {lesson.videoUrls.filter(u => u.trim()).length} Links</span>}
                                        {lesson.attachments?.length > 0 && <span className="text-[10px] bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-black uppercase tracking-tighter border border-purple-100 shadow-sm">📎 {lesson.attachments.length} Files</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button
                                    onClick={() => handleEditLesson(lesson)}
                                    className="p-3 bg-gray-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    title="Edit Lesson"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const updatedStatus = !lesson.isPublished;
                                            await api.put(`/lessons/${lesson._id}`, { isPublished: updatedStatus });
                                            setLessons(lessons.map(l => l._id === lesson._id ? { ...l, isPublished: updatedStatus } : l));
                                        } catch (err: any) {
                                            alert(err.response?.data?.error || 'Failed to update status');
                                        }
                                    }}
                                    className={`p-3 rounded-xl transition-all shadow-sm ${lesson.isPublished ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-500 hover:text-white'}`}
                                    title={lesson.isPublished ? 'Unpublish' : 'Publish'}
                                >
                                    {lesson.isPublished ? '⏸️' : '▶️'}
                                </button>
                                <button
                                    onClick={() => handleDeleteLesson(lesson._id)}
                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    title="Delete Lesson"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ManageCourse;

