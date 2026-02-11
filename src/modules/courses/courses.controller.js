const Course = require('../../db/models/course');
const Enrollment = require('../../db/models/enrollment');

// CREATE COURSE (Teacher only)
exports.createCourse = async (req, res) => {
    try {
        const { title, description, enrollmentKey, isPublic, category, level, duration } = req.body;

        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Only teachers can create courses' });
        }

        const course = await Course.create({
            title,
            description,
            teacher: req.user.id,
            enrollmentKey: enrollmentKey || null,
            isPublic: isPublic !== undefined ? isPublic : true,
            category: category || 'Other',
            level: level || 'Beginner',
            duration: duration || null,
        });

        const populated = await Course.findById(course._id).populate('teacher', 'username email');

        return res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// GET ALL COURSES (with filters and search)
exports.getAllCourses = async (req, res) => {
    try {
        const { search, teacher, category, level, isPublic } = req.query;
        const filter = {};

        if (isPublic === undefined || isPublic === 'true') {
            filter.isPublic = true;
        } else if (isPublic === 'false') {
            filter.isPublic = false;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (teacher) {
            filter.teacher = teacher;
        }

        if (category) {
            filter.category = category;
        }

        if (level) {
            filter.level = level;
        }

        const courses = await Course.find(filter)
            .populate('teacher', 'username email')
            .sort({ createdAt: -1 });

        return res.json(courses);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// GET SINGLE COURSE
exports.getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('teacher', 'username email');

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        return res.json(course);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// UPDATE COURSE (Teacher only - own courses)
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this course' });
        }

        const updated = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('teacher', 'username email');

        return res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// DELETE COURSE (Teacher or Admin)
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this course' });
        }

        await Enrollment.deleteMany({ course: req.params.id });

        await course.deleteOne();

        return res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// ENROLL IN COURSE (Student only)
exports.enrollInCourse = async (req, res) => {
    try {
        const { enrollmentKey } = req.body;

        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can enroll in courses' });
        }

        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (!course.isPublic && course.enrollmentKey) {
            if (!enrollmentKey || enrollmentKey !== course.enrollmentKey) {
                return res.status(403).json({ error: 'Invalid enrollment key' });
            }
        }

        const existing = await Enrollment.findOne({
            student: req.user.id,
            course: req.params.id,
        });

        if (existing) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        const enrollment = await Enrollment.create({
            student: req.user.id,
            course: req.params.id,
        });

        const populated = await Enrollment.findById(enrollment._id)
            .populate('student', 'username email')
            .populate('course', 'title description');

        return res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// GET MY COURSES
exports.getMyCourses = async (req, res) => {
    try {
        if (req.user.role === 'teacher') {
            const courses = await Course.find({ teacher: req.user.id }).sort({ createdAt: -1 });
            return res.json(courses);
        } else if (req.user.role === 'student') {
            const enrollments = await Enrollment.find({ student: req.user.id })
                .populate({
                    path: 'course',
                    populate: { path: 'teacher', select: 'username email' },
                })
                .sort({ enrolledAt: -1 });

            const courses = enrollments.map((e) => ({
                ...e.course.toObject(),
                enrollmentId: e._id,
                progress: e.progress,
                status: e.status,
                enrolledAt: e.enrolledAt,
            }));

            return res.json(courses);
        } else {
            return res.status(403).json({ error: 'Invalid user role' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// GET COURSE ENROLLMENTS (Teacher only)
exports.getCourseEnrollments = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view enrollments' });
        }

        const enrollments = await Enrollment.find({ course: req.params.id })
            .populate('student', 'username email')
            .sort({ enrolledAt: -1 });

        return res.json(enrollments);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// UPDATE ENROLLMENT PROGRESS (Teacher only)
exports.updateEnrollmentProgress = async (req, res) => {
    try {
        const { progress, status } = req.body;
        const enrollmentId = req.params.enrollmentId;

        const enrollment = await Enrollment.findById(enrollmentId).populate('course');

        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        const course = await Course.findById(enrollment.course._id);
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (progress !== undefined) {
            enrollment.progress = progress;
        }

        if (status !== undefined) {
            enrollment.status = status;
            if (status === 'completed') {
                enrollment.completedAt = new Date();
            }
        }

        await enrollment.save();

        const populated = await Enrollment.findById(enrollment._id)
            .populate('student', 'username email')
            .populate('course', 'title');

        return res.json(populated);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// GET ENROLLMENT FOR SPECIFIC COURSE (Student)
exports.getEnrollment = async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            student: req.user.id,
            course: req.params.id
        });

        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        return res.json(enrollment);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};