const Assignment = require('../../db/models/assignment');
const Course = require('../../db/models/course');
const Enrollment = require('../../db/models/enrollment');

// CREATE ASSIGNMENT (Teacher only)
exports.createAssignment = async (req, res) => {
    try {
        const { title, description, courseId, dueDate, maxGrade } = req.body;

        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Only teachers can create assignments' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to create assignments for this course' });
        }

        const assignment = await Assignment.create({
            title,
            description,
            course: courseId,
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
        const { content, fileUrl } = req.body;

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

        if (new Date() > assignment.dueDate) {
            return res.status(400).json({ error: 'Assignment deadline has passed' });
        }

        const existingSubmission = assignment.submissions.find(
            (sub) => sub.student.toString() === req.user.id
        );

        if (existingSubmission) {
            return res.status(400).json({ error: 'You have already submitted this assignment' });
        }

        assignment.submissions.push({
            student: req.user.id,
            content: content || null,
            fileUrl: fileUrl || null,
            submittedAt: new Date(),
        });

        await assignment.save();

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
        if (course.teacher.toString() !== req.user.id) {
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