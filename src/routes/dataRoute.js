const express = require('express');
const router = express.Router();
const DataController = require('../controllers/dataController');

// Route untuk ESP mengirim data (POST)
// Endpoint: /api/feeder/log
router.post('/log', DataController.receiveData);

// Route untuk Frontend mengambil data (GET)
// Endpoint: /api/feeder/data
router.get('/data', DataController.getRealtimeData);

// Route untuk Frontend mengambil data terbaru saja (GET)
// Endpoint: /api/feeder/latest
router.get('/latest', DataController.getLatestData);

// Route untuk Frontend mengambil data berdasarkan ID (GET)
// Endpoint: /api/feeder/data/:id
router.get('/data/:id', DataController.getDataById);

module.exports = router;