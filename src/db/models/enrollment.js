const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'dropped'],
            default: 'active',
        },
        enrolledAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'enrollments',
        versionKey: false,
        strict: 'throw',
    }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);