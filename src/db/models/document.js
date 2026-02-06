const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        price: {
            type: Number,
            required: [true, 'Price field is required and must be number'],
        },
        rating: {
            type: Number,
            required: [true, 'Rating field is required and must be number'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount field is required'],
            validate: {
                validator: Number.isInteger,
                message: 'Amount field must be integer',
            },
        },
    },
    {
        timestamps: true,
        collection: 'measurements',
        versionKey: false,
        strict: 'throw',
    }
);

module.exports = mongoose.model('Document', documentSchema);