const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: [true, 'Question text is required'],
    },
    options: {
        type: [String],
        required: [true, 'Options are required'],
        validate: {
            validator: function (v) {
                return v.length >= 2;
            },
            message: 'At least 2 options are required'
        }
    },
    correctOptionIndex: {
        type: Number,
        required: [true, 'Correct option index is required'],
        min: 0,
    },
    points: {
        type: Number,
        default: 1,
        min: 1,
    }
});

const quizSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Quiz title is required'],
            trim: true,
            maxlength: 150,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course reference is required'],
        },
        questions: [questionSchema],
        timeLimit: {
            type: Number, // in minutes
            default: null,
        },
        passingScore: {
            type: Number, // Percentage
            default: 50,
            min: 0,
            max: 100,
        },
        attemptsAllowed: {
            type: Number,
            default: 1,
            min: 1,
        },
        isPublished: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
        collection: 'quizzes',
        versionKey: false,
        strict: 'throw',
    }
);

quizSchema.index({ course: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
