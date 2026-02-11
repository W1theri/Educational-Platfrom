const path = require('path');

exports.uploadFile = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        // Return file URL
        // Assuming server is running on localhost:3000 (or whatever host)
        // Ideally domain should be from env
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        return res.status(201).json({
            message: 'File uploaded successfully',
            fileUrl: fileUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error during upload' });
    }
};
