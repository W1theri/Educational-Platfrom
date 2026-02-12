const Grade = require('../../db/models/grade');
const Course = require('../../db/models/course');
const Enrollment = require('../../db/models/enrollment');

const withLateFallback = (grade) => {
    if (!grade) return grade;
    const plain = grade.toObject ? grade.toObject() : grade;
    if (typeof plain.isLate === 'boolean') return plain;
    const dueDate = plain.assignment?.dueDate ? new Date(plain.assignment.dueDate) : null;
    const submittedAt = plain.submittedAt ? new Date(plain.submittedAt) : null;
    return {
        ...plain,
        isLate: Boolean(dueDate && submittedAt && submittedAt > dueDate),
    };
};

// GET STUDENT GRADES FOR A COURSE
exports.getStudentGradesForCourse = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;

        // Check authorization
        if (req.user.role === 'student' && req.user.id !== studentId) {
            return res.status(403).json({ error: 'Not authorized to view these grades' });
        }

        const grades = await Grade.find({ student: studentId, course: courseId })
            .populate('lesson', 'title order')
            .populate('assignment', 'title maxGrade')
            .sort({ 'lesson.order': 1 });

        return res.json(grades.map(withLateFallback));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// GET STUDENT GRADEBOOK (all grades across all courses)
exports.getStudentGradeBook = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Get all enrollments
        const enrollments = await Enrollment.find({ student: studentId })
            .populate('course', 'title teacher')
            .sort({ enrolledAt: -1 });

        const gradebook = await Promise.all(
            enrollments.map(async (enrollment) => {
                const grades = await Grade.find({
                    student: studentId,
                    course: enrollment.course._id,
                })
                    .populate('lesson', 'title order')
                    .populate('assignment', 'title maxGrade dueDate')
                    .sort({ 'lesson.order': 1 });

                return {
                    course: enrollment.course,
                    enrolledAt: enrollment.enrolledAt,
                    grades: grades.map(withLateFallback),
                };
            })
        );

        return res.json(gradebook);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// GET ALL GRADES FOR A COURSE (Teacher view)
exports.getCourseGrades = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check authorization
        if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view these grades' });
        }

        const grades = await Grade.find({ course: courseId })
            .populate('student', 'username email')
            .populate('lesson', 'title order')
            .populate('assignment', 'title maxGrade')
            .sort({ 'student.username': 1, 'lesson.order': 1 });

        // Group by student
        const studentGrades = {};
        grades.forEach((gradeDoc) => {
            const grade = withLateFallback(gradeDoc);
            const studentId = grade.student._id.toString();
            if (!studentGrades[studentId]) {
                studentGrades[studentId] = {
                    student: grade.student,
                    grades: [],
                };
            }
            studentGrades[studentId].grades.push(grade);
        });

        return res.json(Object.values(studentGrades));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};
