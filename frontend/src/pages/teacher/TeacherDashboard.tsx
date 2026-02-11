import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

interface Course {
    _id: string;
    title: string;
    description: string;
    isPublic: boolean;
}

const TeacherDashboard: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses/my/courses');
                setCourses(response.data);
            } catch (err) {
                console.error('Failed to fetch courses', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            await api.delete(`/courses/${id}`);
            setCourses(courses.filter(c => c._id !== id));
        } catch (err) {
            console.error('Failed to delete course', err);
            alert('Failed to delete course');
        }
    };

    if (loading) return <div>Loading courses...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Courses</h2>
                <Link to="/teacher/create-course" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    + Create Course
                </Link>
            </div>

            {courses.length === 0 ? (
                <div className="bg-white p-6 rounded shadow text-center">
                    <p className="text-gray-500">You haven't created any courses yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course._id} className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                            <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                <span className={`px-2 py-1 rounded ${course.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {course.isPublic ? 'Public' : 'Private'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Link to={`/courses/${course._id}`} className="flex-1 text-center py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
                                    View
                                </Link>
                                <button
                                    onClick={() => handleDelete(course._id)}
                                    className="flex-1 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
