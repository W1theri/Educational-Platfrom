const router = require('express').Router();
const controller = require('./assignments.controller');
const auth = require('../../middlewares/auth.middleware');

router.use(auth);

router.post('/', controller.createAssignment);
router.get('/course/:courseId', controller.getAssignmentsByCourse);
router.get('/my/submissions', controller.getMySubmissions);
router.get('/:id', controller.getAssignment);
router.put('/:id', controller.updateAssignment);
router.delete('/:id', controller.deleteAssignment);
router.post('/:id/submit', controller.submitAssignment);
router.put('/:id/grade', controller.gradeSubmission);

module.exports = router;