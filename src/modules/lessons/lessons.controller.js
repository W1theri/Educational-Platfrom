const Lesson = require('../../db/models/lesson');
const Course = require('../../db/models/course');
const Enrollment = require('../../db/models/enrollment');

// CREATE LESSON (Teacher only)
exports.createLesson = async (req, res) => {
    try {
        const { title, courseId, content, videoUrl, order, isPublished } = req.body;

        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Only teachers can create lessons' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized for this course' });
        }

        const lesson = await Lesson.create({
            title,
            course: courseId,
            content,
            videoUrl,
            order: order || 0,
            isPublished: isPublished !== undefined ? isPublished : true,
        });

        return res.status(201).json(lesson);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// GET LESSONS FOR COURSE (Public or Enrolled)
exports.getLessonsByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check verification (Teacher, Admin, or Enrolled Student)
        let isAuthorized = false;

        if (req.user.role === 'admin') isAuthorized = true;
        else if (req.user.role === 'teacher' && course.teacher.toString() === req.user.id) isAuthorized = true;
        else {
            const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
            if (enrollment) isAuthorized = true;
        }

        if (!isAuthorized) {
            return res.status(403).json({ error: 'Access denied. Please enroll in the course.' });
        }

        const query = { course: courseId };
        // Students only see published lessons
        if (req.user.role === 'student') {
            query.isPublished = true;
        }

        const lessons = await Lesson.find(query).sort({ order: 1 });
        return res.json(lessons);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// GET SINGLE LESSON
exports.getLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate('course');
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const courseId = lesson.course._id;
        const course = await Course.findById(courseId);

        let isAuthorized = false;
        if (req.user.role === 'admin') isAuthorized = true;
        else if (req.user.role === 'teacher' && course.teacher.toString() === req.user.id) isAuthorized = true;
        else {
            const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
            if (enrollment) isAuthorized = true;
        }

        if (!isAuthorized) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        return res.json(lesson);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// UPDATE LESSON
exports.updateLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate('course');
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Check ownership
        const course = await Course.findById(lesson.course._id);
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const allowedUpdates = ['title', 'content', 'videoUrl', 'order', 'isPublished'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates' });
        }

        updates.forEach((update) => (lesson[update] = req.body[update]));
        await lesson.save();

        return res.json(lesson);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
};

// DELETE LESSON
exports.deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate('course');
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const course = await Course.findById(lesson.course._id);
        if (course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await lesson.deleteOne();
        return res.json({ message: 'Lesson deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};
