const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const path = require('path');
const dataRoutes = require('./src/routes/dataRoute');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Penting agar frontend bisa akses
app.use(bodyParser.json()); // Agar bisa baca JSON dari ESP
app.use(bodyParser.urlencoded({ extended: true })); // Agar bisa baca Form urlencoded (opsional)

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/feeder', dataRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});