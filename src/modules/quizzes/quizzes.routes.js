const express = require('express');
const router = express.Router();
const quizController = require('./quizzes.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

// Public/Student routes (need auth)
router.get('/:id', authMiddleware, quizController.getQuiz);
router.post('/:id/submit', authMiddleware, quizController.submitQuiz);

// Teacher routes
router.post('/', authMiddleware, quizController.createQuiz);
// Add update/delete later if needed

module.exports = router;
