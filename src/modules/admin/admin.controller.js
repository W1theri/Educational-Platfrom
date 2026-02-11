const User = require("../../db/models/user");
const Course = require("../../db/models/course");
const Enrollment = require("../../db/models/enrollment");

exports.getDashboardStats = async (req, res) => {
    try {
        const [totalStudents, totalTeachers, totalCourses, enrollments] = await Promise.all([
            User.countDocuments({ role: "student" }),
            User.countDocuments({ role: "teacher" }),
            Course.countDocuments(),
            Enrollment.find()
        ]);

        const averageProgress = enrollments.length > 0
            ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / enrollments.length)
            : 0;

        return res.json({
            totalStudents,
            totalTeachers,
            totalCourses,
            averageProgress
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.getCourseAnalytics = async (req, res) => {
    try {
        const courses = await Course.find().populate("teacher", "username");
        const analytics = await Promise.all(courses.map(async (course) => {
            const enrollments = await Enrollment.find({ course: course._id })
                .populate("student", "username email");

            return {
                _id: course._id,
                title: course.title,
                teacher: course.teacher?.username,
                studentCount: enrollments.length,
                students: enrollments.map(e => ({
                    username: e.student.username,
                    email: e.student.email,
                    progress: e.progress,
                    status: e.status,
                    enrolledAt: e.enrolledAt
                }))
            };
        }));

        return res.json(analytics);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};
