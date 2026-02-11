const express = require('express');
const router = express.Router();
const resourceController = require('./resources.controller');
const upload = require('../../middlewares/upload.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');

// Upload endpoint - Protected
// 'file' is the key expected in form-data
router.post('/upload', authMiddleware, upload.single('file'), resourceController.uploadFile);

module.exports = router;
