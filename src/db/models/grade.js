const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student is required'],
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required'],
        },
        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            required: [true, 'Lesson is required'],
        },
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignment',
            required: [true, 'Assignment is required'],
        },
        grade: {
            type: Number,
            min: 0,
            max: 100,
            default: null,
        },
        status: {
            type: String,
            enum: ['not_submitted', 'pending', 'graded'],
            default: 'not_submitted',
        },
        submittedAt: {
            type: Date,
            default: null,
        },
        gradedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'grades',
        versionKey: false,
        strict: 'throw',
    }
);

gradeSchema.index({ student: 1, course: 1 });
gradeSchema.index({ student: 1, assignment: 1 }, { unique: true });
gradeSchema.index({ course: 1 });
gradeSchema.index({ lesson: 1 });

module.exports = mongoose.model('Grade', gradeSchema);
