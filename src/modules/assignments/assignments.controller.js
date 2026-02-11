const Assignment = require('../../db/models/assignment');
const Course = require('../../db/models/course');
const Enrollment = require('../../db/models/enrollment');
const Lesson = require('../../db/models/lesson');
const Grade = require('../../db/models/grade');

// CREATE ASSIGNMENT (Teacher only)
exports.createAssignment = async (req, res) => {
    try {
        const { title, description, lessonId, courseId, dueDate, maxGrade } = req.body;

        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only teachers can create assignments' });
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const course = await Course.findById(courseId || lesson.course);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to create assignments for this course' });
        }

        const assignment = await Assignment.create({
            title,
            description,
            lesson: lessonId,
            course: course._id,
            dueDate: new Date(dueDate),
            maxGrade: maxGrade || 100,
        });

        return res.status(201).json(assignment);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// GET ASSIGNMENTS FOR COURSE
exports.getAssignmentsByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const assignments = await Assignment.find({ course: courseId })
            .populate('course', 'title')
            .sort({ dueDate: 1 });

        return res.json(assignments);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// GET SINGLE ASSIGNMENT
exports.getAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id).populate('course', 'title teacher');

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        return res.json(assignment);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// UPDATE ASSIGNMENT (Teacher only)
exports.updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id).populate('course');

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const course = await Course.findById(assignment.course._id);
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this assignment' });
        }

        const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        return res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// DELETE ASSIGNMENT (Teacher only)
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id).populate('course');

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const course = await Course.findById(assignment.course._id);
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this assignment' });
        }

        await assignment.deleteOne();

        return res.json({ message: 'Assignment deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// SUBMIT ASSIGNMENT (Student only)
exports.submitAssignment = async (req, res) => {
    try {
        let { content, fileUrl, filename } = req.body;

        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can submit assignments' });
        }

        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const enrollment = await Enrollment.findOne({
            student: req.user.id,
            course: assignment.course,
        });

        if (!enrollment) {
            return res.status(403).json({ error: 'You are not enrolled in this course' });
        }

        const existingSubmission = assignment.submissions.find(
            (sub) => sub.student.toString() === req.user.id
        );

        if (existingSubmission) {
            return res.status(400).json({ error: 'You have already submitted this assignment' });
        }

        // Handle uploaded file
        if (req.file) {
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            try {
                // Handle UTF-8 encoding for filename
                filename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
            } catch (e) {
                filename = req.file.originalname;
            }
        }

        assignment.submissions.push({
            student: req.user.id,
            content: content || null,
            fileUrl: fileUrl || null,
            filename: filename || null,
            submittedAt: new Date(),
        });

        await assignment.save();

        // Create or update grade record
        await Grade.findOneAndUpdate(
            { student: req.user.id, assignment: assignment._id },
            {
                student: req.user.id,
                course: assignment.course,
                lesson: assignment.lesson,
                assignment: assignment._id,
                status: 'pending',
                submittedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        const populated = await Assignment.findById(assignment._id)
            .populate('submissions.student', 'username email');

        return res.json(populated);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// GRADE SUBMISSION (Teacher only)
exports.gradeSubmission = async (req, res) => {
    try {
        const { studentId, grade, feedback } = req.body;

        const assignment = await Assignment.findById(req.params.id).populate('course');

        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const course = await Course.findById(assignment.course._id);
        if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to grade this assignment' });
        }

        const submission = assignment.submissions.find(
            (sub) => sub.student.toString() === studentId
        );

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        if (grade !== undefined) {
            if (grade < 0 || grade > assignment.maxGrade) {
                return res.status(400).json({
                    error: `Grade must be between 0 and ${assignment.maxGrade}`,
                });
            }
            submission.grade = grade;
        }

        if (feedback !== undefined) {
            submission.feedback = feedback;
        }

        submission.gradedAt = new Date();

        await assignment.save();

        // Update grade record
        await Grade.findOneAndUpdate(
            { student: studentId, assignment: assignment._id },
            {
                grade: grade,
                status: 'graded',
                gradedAt: new Date(),
            },
            { new: true }
        );

        const populated = await Assignment.findById(assignment._id)
            .populate('submissions.student', 'username email');

        return res.json(populated);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// GET MY SUBMISSIONS (Student)
exports.getMySubmissions = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can view their submissions' });
        }

        const assignments = await Assignment.find({
            'submissions.student': req.user.id,
        })
            .populate('course', 'title')
            .sort({ dueDate: -1 });

        const mySubmissions = assignments.map((assignment) => {
            const submission = assignment.submissions.find(
                (sub) => sub.student.toString() === req.user.id
            );

            return {
                assignmentId: assignment._id,
                assignmentTitle: assignment.title,
                course: assignment.course,
                dueDate: assignment.dueDate,
                maxGrade: assignment.maxGrade,
                submission: {
                    content: submission.content,
                    fileUrl: submission.fileUrl,
                    grade: submission.grade,
                    feedback: submission.feedback,
                    submittedAt: submission.submittedAt,
                    gradedAt: submission.gradedAt,
                },
            };
        });

        return res.json(mySubmissions);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// GET ASSIGNMENT BY LESSON
exports.getAssignmentByLesson = async (req, res) => {
    try {
        const assignment = await Assignment.findOne({ lesson: req.params.lessonId })
            .populate('course', 'title teacher')
            .populate('lesson', 'title')
            .populate('submissions.student', 'username email')
            .populate('submissions.comments.author', 'username');

        if (!assignment) {
            return res.status(404).json({ error: 'No assignment found for this lesson' });
        }

        return res.json(assignment);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// GET ASSIGNMENTS OVERVIEW FOR TEACHER
exports.getAssignmentsOverview = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view this course' });
        }

        const assignments = await Assignment.find({ course: courseId })
            .populate('lesson', 'title order')
            .sort({ 'lesson.order': 1 });

        const overview = assignments.map((assignment) => {
            const totalSubmissions = assignment.submissions.length;
            const gradedCount = assignment.submissions.filter((sub) => sub.grade !== null).length;
            const pendingCount = totalSubmissions - gradedCount;

            return {
                assignmentId: assignment._id,
                assignmentTitle: assignment.title,
                lesson: assignment.lesson,
                dueDate: assignment.dueDate,
                maxGrade: assignment.maxGrade,
                stats: {
                    total: totalSubmissions,
                    graded: gradedCount,
                    pending: pendingCount,
                },
            };
        });

        return res.json(overview);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ADD COMMENT TO SUBMISSION
exports.addComment = async (req, res) => {
    try {
        const { submissionId, content } = req.body;

        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const submission = assignment.submissions.id(submissionId);
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Check authorization
        const course = await Course.findById(assignment.course);
        const isTeacher = req.user.role === 'teacher' && course.teacher.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isStudent = submission.student.toString() === req.user.id;

        if (!isTeacher && !isAdmin && !isStudent) {
            return res.status(403).json({ error: 'Not authorized to comment on this submission' });
        }

        submission.comments.push({
            author: req.user.id,
            content: content,
            createdAt: new Date(),
        });

        await assignment.save();

        const populated = await Assignment.findById(assignment._id)
            .populate('submissions.student', 'username email')
            .populate('submissions.comments.author', 'username role');

        return res.json(populated);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};
