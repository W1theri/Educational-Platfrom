const express = require('express');
const router = express.Router();
const lessonController = require('./lessons.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

// Public/Student routes (but need auth to view content if enrolled)
router.get('/:id', authMiddleware, lessonController.getLesson);

// Teacher routes
router.post('/', authMiddleware, upload.array('files'), lessonController.createLesson);
router.put('/:id', authMiddleware, upload.array('files'), lessonController.updateLesson);
router.post('/:id/complete', authMiddleware, lessonController.toggleLessonCompletion);
router.delete('/:id', authMiddleware, lessonController.deleteLesson);

module.exports = router;
