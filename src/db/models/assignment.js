const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileUrl: {
        type: String,
        default: null,
    },
    content: {
        type: String,
        default: null,
    },
    grade: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
    },
    feedback: {
        type: String,
        default: null,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    gradedAt: {
        type: Date,
        default: null,
    },
}, { _id: true });

const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Assignment title is required'],
            trim: true,
            maxlength: 150,
        },
        description: {
            type: String,
            required: [true, 'Assignment description is required'],
            maxlength: 2000,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required'],
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
        },
        maxGrade: {
            type: Number,
            default: 100,
            min: 1,
        },
        submissions: [submissionSchema],
    },
    {
        timestamps: true,
        collection: 'assignments',
        versionKey: false,
        strict: 'throw',
    }
);

assignmentSchema.index({ course: 1 });
assignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);