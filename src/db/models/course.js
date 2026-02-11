const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
            minlength: 3,
            maxlength: 100,
        },
        description: {
            type: String,
            required: [true, 'Course description is required'],
            trim: true,
            maxlength: 1000,
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Teacher is required'],
        },
        enrollmentKey: {
            type: String,
            default: null,
            trim: true,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        category: {
            type: String,
            enum: ['Backend', 'Frontend', 'Data', 'Security', 'DevOps', 'Mobile', 'Development', 'Business', 'Design', 'Marketing', 'Other'],
            default: 'Other',
        },
        level: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner',
        },
        duration: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'courses',
        versionKey: false,
        strict: 'throw',
    }
);

courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ teacher: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Course', courseSchema);