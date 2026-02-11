import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateCourse from './pages/teacher/CreateCourse';
import ManageCourse from './pages/teacher/ManageCourse';
import AdminDashboard from './pages/admin/AdminDashboard';
import AssignmentsOverview from './pages/teacher/AssignmentsOverview';
import SubmissionReview from './pages/teacher/SubmissionReview';
import GradeBook from './pages/student/GradeBook';

import BrowseCourses from './pages/BrowseCourses';
import CourseDetail from './pages/CourseDetail';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div>Loading...</div>;
    if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route
                        path="/teacher/create-course"
                        element={
                            <ProtectedRoute>
                                <CreateCourse />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/manage-course/:id"
                        element={
                            <ProtectedRoute>
                                <ManageCourse />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/courses/:courseId/assignments"
                        element={
                            <ProtectedRoute>
                                <AssignmentsOverview />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/assignments/:assignmentId/review"
                        element={
                            <ProtectedRoute>
                                <SubmissionReview />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/gradebook"
                        element={
                            <ProtectedRoute>
                                <GradeBook />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/courses"
                        element={
                            <ProtectedRoute>
                                <BrowseCourses />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/courses/:id"
                        element={
                            <ProtectedRoute>
                                <CourseDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
