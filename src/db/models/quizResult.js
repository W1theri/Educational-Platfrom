const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student reference is required'],
        },
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: [true, 'Quiz reference is required'],
        },
        score: {
            type: Number,
            required: true,
            min: 0,
        },
        totalPoints: {
            type: Number,
            required: true,
            min: 0,
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        passed: {
            type: Boolean,
            required: true,
        },
        answers: {
            type: [Number], // Array of selected option indices
            default: [],
        },
        attemptNumber: {
            type: Number,
            default: 1,
        }
    },
    {
        timestamps: true,
        collection: 'quiz_results',
        versionKey: false,
        strict: 'throw',
    }
);

quizResultSchema.index({ student: 1, quiz: 1 });

module.exports = mongoose.model('QuizResult', quizResultSchema);
