const router = require('express').Router();
const controller = require('./assignments.controller');
const upload = require('../../middlewares/upload.middleware');

router.use(auth);

router.post('/', controller.createAssignment);
router.get('/course/:courseId', controller.getAssignmentsByCourse);
router.get('/course/:courseId/overview', controller.getAssignmentsOverview);
router.get('/lesson/:lessonId', controller.getAssignmentByLesson);
router.get('/my/submissions', controller.getMySubmissions);
router.get('/:id', controller.getAssignment);
router.put('/:id', controller.updateAssignment);
router.delete('/:id', controller.deleteAssignment);
router.post('/:id/submit', upload.single('file'), controller.submitAssignment);
router.put('/:id/grade', controller.gradeSubmission);
router.post('/:id/comment', controller.addComment);

module.exports = router;
