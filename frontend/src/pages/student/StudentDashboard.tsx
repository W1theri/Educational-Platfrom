import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

interface EnrolledCourse {
    _id: string;
    title: string;
    description: string;
    progress: number;
    teacher: {
        username: string;
    };
}

import { Link } from 'react-router-dom';

const StudentDashboard: React.FC = () => {
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses/my/courses');
                setCourses(response.data);
            } catch (err) {
                console.error('Failed to fetch courses');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) return <div>Loading courses...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Learning</h2>
                <div className="flex gap-2">
                    <Link to="/student/gradebook" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                        📊 Мой дневник
                    </Link>
                    <Link to="/courses" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Browse Courses
                    </Link>
                </div>
            </div>

            {courses.length === 0 ? (
                <div className="bg-white p-6 rounded shadow text-center">
                    <p className="text-gray-500">You are not enrolled in any courses yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course._id} className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                            <p className="text-sm text-gray-500 mb-2">Instructor: {course.teacher.username}</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">{course.progress}% Complete</span>
                                <Link to={`/courses/${course._id}`} className="text-blue-600 hover:text-blue-800 font-medium">Continue</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
