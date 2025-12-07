const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const path = require('path');
const dataRoutes = require('./src/routes/dataRoute');

const app = express();
const PORT = process.env.PORT || 3000;

const mysql = require('mysql2'); 

const db = mysql.createConnection({
    host: process.env.DB_HOST,      // Kita pakai variabel Environment biar aman
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,   // Di Aiven biasanya namanya 'defaultdb'
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false    // Wajib untuk Aiven/Cloud DB
    }
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to Cloud DB:', err.message);
    } else {
        console.log('Connected to Aiven MySQL Cloud Database!');
    }
});

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