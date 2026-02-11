const router = require('express').Router();
const controller = require('./grades.controller');
const auth = require('../../middlewares/auth.middleware');

router.use(auth);

router.get('/student/:studentId/course/:courseId', controller.getStudentGradesForCourse);
router.get('/student/me/gradebook', controller.getStudentGradeBook);
router.get('/course/:courseId', controller.getCourseGrades);

module.exports = router;
