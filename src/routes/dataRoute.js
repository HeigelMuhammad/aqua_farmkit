const express = require('express');
const router = express.Router();
const DataController = require('../controllers/dataController');

// Route untuk ESP mengirim data (POST)
// Endpoint: /api/feeder/log
router.post('/log', DataController.receiveData);

// Route untuk Frontend mengambil data (GET)
// Endpoint: /api/feeder/data
router.get('/data', DataController.getRealtimeData);

module.exports = router;