const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Lesson title is required'],
            trim: true,
            maxlength: 150,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course reference is required'],
        },
        content: {
            type: String,
            required: [true, 'Lesson content is required'],
        },
        videoUrls: [{
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return !v || v.match(/^(http(s)?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/);
                },
                message: 'Invalid URL format'
            }
        }],
        attachments: [{
            filename: String,
            fileUrl: String,
            mimetype: String,
            size: Number
        }],
        order: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        // Assignment fields
        isAssignment: {
            type: Boolean,
            default: false,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        maxGrade: {
            type: Number,
            default: 100,
            min: 1,
        },
    },
    {
        timestamps: true,
        collection: 'lessons',
        versionKey: false,
        strict: 'throw',
    }
);

lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
