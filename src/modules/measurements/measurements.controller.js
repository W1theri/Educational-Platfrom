// measurements.controller.js (updated to use createdAt instead of timestamp)
const Document = require("../../db/models/document");

exports.getTimeSeries = async (req, res) => {
    try {
        const { field, start_date, end_date } = req.query;

        if (!field) {
            return res.status(400).json({
                error: 'Parameter "field" is required'
            });
        }

        const filter = { [field]: { $exists: true } };

        if (start_date || end_date) {
            filter.createdAt = {};

            if (start_date) {
                const start = new Date(start_date);
                if (isNaN(start)) {
                    return res.status(400).json({ error: 'Invalid start_date format' });
                }
                filter.createdAt.$gte = start;
            }

            if (end_date) {
                const end = new Date(end_date);
                if (isNaN(end)) {
                    return res.status(400).json({ error: 'Invalid end_date format' });
                }
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const data = await Document
            .find(filter)
            .select(`createdAt ${field}`)
            .sort({ createdAt: 1 })
            .lean();

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getMetrics = async (req, res) => {
    try {
        const { field, start_date, end_date } = req.query;

        if (!field) {
            return res.status(400).json({
                error: 'Parameter "field" is required'
            });
        }

        const matchStage = {
            [field]: { $exists: true, $ne: null }
        };

        if (start_date || end_date) {
            matchStage.createdAt = {};

            if (start_date) {
                const start = new Date(start_date);
                if (isNaN(start)) {
                    return res.status(400).json({ error: 'Invalid start_date format' });
                }
                matchStage.createdAt.$gte = start;
            }

            if (end_date) {
                const end = new Date(end_date);
                if (isNaN(end)) {
                    return res.status(400).json({ error: 'Invalid end_date format' });
                }
                end.setHours(23, 59, 59, 999);
                matchStage.createdAt.$lte = end;
            }
        }

        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    avg: { $avg: `$${field}` },
                    min: { $min: `$${field}` },
                    max: { $max: `$${field}` },
                    stdDev: { $stdDevPop: `$${field}` }
                }
            },
            {
                $project: {
                    _id: 0,
                    avg: { $round: ['$avg', 2] },
                    min: { $round: ['$min', 2] },
                    max: { $round: ['$max', 2] },
                    stdDev: { $round: ['$stdDev', 4] }
                }
            }
        ];

        const [result] = await Document.aggregate(pipeline);

        if (!result) {
            return res.json({
                avg: null,
                min: null,
                max: null,
                stdDev: null
            });
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.seed = async (req, res) => {
    try {
        const count = await Document.countDocuments();
        if (count > 50) {
            return res.json({
                message: `Коллекция уже содержит ${count} записей. Заполнение пропущено.`,
            });
        }

        const documents = [];
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - 120);

        for (let i = 0; i < 120; i++) {
            const price = Number((Math.random() * 180 + 20).toFixed(2));
            const rating = Number((Math.random() * 3 + 2).toFixed(1));
            const amount = Math.floor(Math.random() * 480) + 20;

            const createdAt = new Date(baseDate);
            createdAt.setDate(createdAt.getDate() + i);

            documents.push({
                price,
                rating,
                amount,
                createdAt,
            });
        }

        const inserted = await Document.insertMany(documents, {
            ordered: false,
            rawResult: true,
        });

        res.status(201).json({
            message: 'Тестовые данные успешно добавлены',
            insertedCount: inserted.insertedCount || documents.length,
            firstFew: documents.slice(0, 3),
        });
    } catch (err) {
        console.error('Ошибка при заполнении тестовыми данными:', err);

        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Ошибка валидации при генерации данных',
                details: err.message,
            });
        }

        res.status(500).json({
            error: 'Не удалось заполнить тестовыми данными',
            message: err.message,
        });
    }
};

exports.clear = async (req, res) => {
    try {
        await Document.deleteMany({});
        res.json({ message: 'Все записи успешно удалены из базы данных' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};