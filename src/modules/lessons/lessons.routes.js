const express = require('express');
const router = express.Router();
const lessonController = require('./lessons.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

// Public/Student routes (but need auth to view content if enrolled)
router.get('/:id', authMiddleware, lessonController.getLesson);

// Teacher routes
router.post('/', authMiddleware, lessonController.createLesson);
router.put('/:id', authMiddleware, lessonController.updateLesson);
router.delete('/:id', authMiddleware, lessonController.deleteLesson);

module.exports = router;
