const router = require('express').Router();
const controller = require('./courses.controller');
const auth = require('../../middlewares/auth.middleware');

router.get('/', controller.getAllCourses);
router.get('/:id', controller.getCourse);

router.get('/my/courses', auth, controller.getMyCourses); 
router.post('/', auth, controller.createCourse);
router.put('/:id', auth, controller.updateCourse);
router.delete('/:id', auth, controller.deleteCourse);
router.post('/:id/enroll', auth, controller.enrollInCourse);
router.get('/:id/enrollments', auth, controller.getCourseEnrollments);
router.put('/enrollments/:enrollmentId', auth, controller.updateEnrollmentProgress);

module.exports = router;