const mongoose = require('mongoose');
const { MONGO_URI, MONGO_DB_NAME } = require('../config/env');

let isConnected = false;

async function connectMongo() {
    if (isConnected) {
        console.log('MongoDB уже подключен');
        return mongoose.connection;
    }

    try {
        await mongoose.connect(MONGO_URI, {
            dbName: MONGO_DB_NAME,
            maxPoolSize: 10,
        });

        isConnected = true;
        console.log('MongoDB connected →', mongoose.connection.name);

        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
            isConnected = false;
        });

        return mongoose.connection;
    } catch (err) {
        console.error('MongoDB connection failed:', err);
        throw err;
    }
}

module.exports = { connectMongo };