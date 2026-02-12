import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Course {
    _id: string;
    title: string;
    description: string;
    teacher: { username: string };
    category: string;
}

const BrowseCourses: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses');
                setCourses(response.data);
            } catch (err) {
                console.error('Failed to fetch courses', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading courses...</div>;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Browse Available Courses</h2>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-600 hover:text-indigo-600 font-medium"
                >
                    ← Back to Dashboard
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course._id} className="bg-white p-6 rounded shadow hover:shadow-lg transition flex flex-col">
                        <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">Instructor: {course.teacher.username}</p>
                        <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">{course.description}</p>
                        <Link
                            to={`/courses/${course._id}`}
                            className="mt-4 text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            View Details
                        </Link>
                    </div>
                ))}
            </div>
            {courses.length === 0 && (
                <p className="text-center text-gray-500">No public courses available yet.</p>
            )}
        </div>
    );
};

export default BrowseCourses;
