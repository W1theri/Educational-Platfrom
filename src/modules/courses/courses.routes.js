const router = require('express').Router();
const controller = require('./courses.controller');
const auth = require('../../middlewares/auth.middleware');

router.get('/', auth, controller.getAllCourses);
router.get('/my/courses', auth, controller.getMyCourses);
router.get('/:id', controller.getCourse);

router.post('/', auth, controller.createCourse);
router.put('/:id', auth, controller.updateCourse);
router.delete('/:id', auth, controller.deleteCourse);
router.post('/:id/enroll', auth, controller.enrollInCourse);
router.get('/:id/enrollment', auth, controller.getEnrollment);
router.get('/:id/enrollments', auth, controller.getCourseEnrollments);
router.put('/enrollments/:enrollmentId', auth, controller.updateEnrollmentProgress);

// Lessons
const lessonController = require('../lessons/lessons.controller');
router.get('/:courseId/lessons', auth, lessonController.getLessonsByCourse);

// Quizzes
const quizController = require('../quizzes/quizzes.controller');
router.get('/:courseId/quizzes', auth, quizController.getQuizzesByCourse);

module.exports = router;
