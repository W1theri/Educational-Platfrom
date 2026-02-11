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
        videoUrl: {
            type: String,
            trim: true,
            default: null,
            validate: {
                validator: function (v) {
                    return v === null || v.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/);
                },
                message: 'Invalid video URL'
            }
        },
        order: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        }
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
