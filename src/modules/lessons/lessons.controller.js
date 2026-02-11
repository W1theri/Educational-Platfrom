const Lesson = require('../../db/models/lesson');
const Course = require('../../db/models/course');
const Enrollment = require('../../db/models/enrollment');
const Assignment = require('../../db/models/assignment');

// CREATE LESSON (Teacher only)
exports.createLesson = async (req, res) => {
    try {
        const { title, courseId, content, videoUrls, order, isPublished, isAssignment, dueDate, maxGrade } = req.body;

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

        // Handle videoUrls: could be a string (if one) or array.
        let urls = [];
        if (videoUrls) {
            urls = Array.isArray(videoUrls) ? videoUrls : [videoUrls];
            // Filter out empty strings
            urls = urls.filter(u => u && u.trim() !== '');
        }

        // Handle attachments
        const attachments = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                let decodedFilename = file.originalname;
                try {
                    // Multer uses latin1 by default for headers. Decode it to UTF-8.
                    decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
                } catch (e) {
                    // Fallback to originalname if decoding fails
                }

                const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
                attachments.push({
                    filename: decodedFilename,
                    fileUrl: fileUrl,
                    mimetype: file.mimetype,
                    size: file.size
                });
            });
        }

        const lessonData = {
            title,
            course: courseId,
            content,
            videoUrls: urls,
            attachments: attachments,
            order: order || 0,
            isPublished: isPublished !== undefined ? isPublished : true,
            isAssignment: isAssignment || false,
        };

        // Add assignment fields if this is an assignment
        if (isAssignment) {
            lessonData.dueDate = dueDate ? new Date(dueDate) : null;
            lessonData.maxGrade = maxGrade || 100;
        }

        const lesson = await Lesson.create(lessonData);

        // Auto-create Assignment if isAssignment is true
        if (isAssignment && dueDate) {
            await Assignment.create({
                title: title,
                description: `Assignment for: ${title}`,
                lesson: lesson._id,
                course: courseId,
                dueDate: new Date(dueDate),
                maxGrade: maxGrade || 100,
            });
        }

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

        const { title, content, videoUrls, order, isPublished, removeAttachments, isAssignment, dueDate, maxGrade } = req.body;

        if (title !== undefined) lesson.title = title;
        if (content !== undefined) lesson.content = content;
        if (order !== undefined) lesson.order = order;
        if (isPublished !== undefined) lesson.isPublished = isPublished;

        // Handle assignment fields
        if (isAssignment !== undefined) lesson.isAssignment = isAssignment;
        if (dueDate !== undefined) lesson.dueDate = dueDate ? new Date(dueDate) : null;
        if (maxGrade !== undefined) lesson.maxGrade = maxGrade;

        if (videoUrls !== undefined) {
            let urls = Array.isArray(videoUrls) ? videoUrls : [videoUrls];
            lesson.videoUrls = urls.filter(u => u && u.trim() !== '');
        }

        // Handle new attachments
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                let decodedFilename = file.originalname;
                try {
                    decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
                } catch (e) {
                    // Fallback
                }
                const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
                lesson.attachments.push({
                    filename: decodedFilename,
                    fileUrl: fileUrl,
                    mimetype: file.mimetype,
                    size: file.size
                });
            });
        }

        // Optional: remove specific attachments
        if (removeAttachments) {
            const toRemove = Array.isArray(removeAttachments) ? removeAttachments : [removeAttachments];
            lesson.attachments = lesson.attachments.filter(att => !toRemove.includes(att._id.toString()));
        }

        await lesson.save();

        // Sync with Assignment record
        if (lesson.isAssignment) {
            await Assignment.findOneAndUpdate(
                { lesson: lesson._id },
                {
                    title: lesson.title,
                    description: `Assignment for: ${lesson.title}`,
                    lesson: lesson._id,
                    course: lesson.course._id,
                    dueDate: lesson.dueDate,
                    maxGrade: lesson.maxGrade,
                },
                { upsert: true, new: true }
            );
        }

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

// TOGGLE LESSON COMPLETION (Student only)
exports.toggleLessonCompletion = async (req, res) => {
    try {
        const lessonId = req.params.id;
        const userId = req.user.id;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const enrollment = await Enrollment.findOne({ student: userId, course: lesson.course });
        if (!enrollment) {
            return res.status(403).json({ error: 'You are not enrolled in this course' });
        }

        const index = enrollment.completedLessons.indexOf(lessonId);
        if (index > -1) {
            // Remove if already exists
            enrollment.completedLessons.splice(index, 1);
        } else {
            // Add if not exists
            enrollment.completedLessons.push(lessonId);
        }

        // Recalculate progress
        const allLessons = await Lesson.find({ course: lesson.course, isPublished: true });
        const totalLessons = allLessons.length;

        if (totalLessons > 0) {
            enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
        } else {
            enrollment.progress = 0;
        }

        if (enrollment.progress === 100) {
            enrollment.status = 'completed';
            enrollment.completedAt = new Date();
        } else {
            enrollment.status = 'active';
            enrollment.completedAt = null;
        }

        await enrollment.save();

        return res.json({
            completedLessons: enrollment.completedLessons,
            progress: enrollment.progress,
            status: enrollment.status
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};
