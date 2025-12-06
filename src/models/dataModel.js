const db = require('../config/db');

const DataModel = {
    // Fungsi simpan data dari ESP
    async createLog(temperature, servo_status) {
        const query = 'INSERT INTO feeder_logs (temperature, servo_status) VALUES (?, ?)';
        const [result] = await db.execute(query, [temperature, servo_status]);
        return result;
    },

    // Fungsi ambil data terakhir (untuk Realtime view di Frontend)
    async getRecentLogs(limit = 10) {
        // Kita ambil data terbaru berdasarkan waktu
        const query = 'SELECT * FROM feeder_logs ORDER BY created_at DESC LIMIT ?';
        // Parse limit ke integer karena query param biasanya string
        const [rows] = await db.execute(query, [parseInt(limit)]);
        return rows;
    },

    // Fungsi ambil data terbaru saja (lebih efisien untuk real-time)
    async getLatestData() {
        const query = 'SELECT * FROM feeder_logs ORDER BY created_at DESC LIMIT 1';
        const [rows] = await db.execute(query);
        return rows[0] || null;
    },

    // Fungsi ambil data berdasarkan ID
    async getDataById(id) {
        const query = 'SELECT * FROM feeder_logs WHERE id = ?';
        const [rows] = await db.execute(query, [id]);
        return rows[0] || null;
    }
};

module.exports = DataModel;