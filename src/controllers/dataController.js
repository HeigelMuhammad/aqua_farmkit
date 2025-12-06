const DataModel = require('../models/dataModel');

const DataController = {
    // Menerima data dari ESP (POST)
    async receiveData(req, res) {
        try {
            const { temperature, servo_status } = req.body;

            // Validasi sederhana
            if (temperature === undefined || !servo_status) {
                return res.status(400).json({ message: 'Data suhu dan status servo wajib ada' });
            }

            await DataModel.createLog(temperature, servo_status);

            res.status(201).json({
                message: 'Data berhasil disimpan',
                data: { temperature, servo_status }
            });
        } catch (error) {
            console.error('Error saving data:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    // Mengirim data ke Frontend (GET)
    async getRealtimeData(req, res) {
        try {
            // Frontend bisa minta ?limit=5 untuk 5 data terakhir
            const limit = req.query.limit || 10; 
            const data = await DataModel.getRecentLogs(limit);

            res.status(200).json({
                message: 'Berhasil mengambil data',
                data: data
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    // Mengirim data terbaru saja (lebih efisien untuk real-time monitoring)
    async getLatestData(req, res) {
        try {
            const data = await DataModel.getLatestData();

            if (!data) {
                return res.status(404).json({
                    message: 'Data tidak ditemukan',
                    data: null
                });
            }

            res.status(200).json({
                message: 'Berhasil mengambil data terbaru',
                data: data
            });
        } catch (error) {
            console.error('Error fetching latest data:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    // Mengirim data berdasarkan ID
    async getDataById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ message: 'ID tidak valid' });
            }

            const data = await DataModel.getDataById(id);

            if (!data) {
                return res.status(404).json({
                    message: 'Data tidak ditemukan',
                    data: null
                });
            }

            res.status(200).json({
                message: 'Berhasil mengambil data',
                data: data
            });
        } catch (error) {
            console.error('Error fetching data by ID:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    // ... kode lama ...

    // ESP32 & Frontend: Ambil Jadwal
    async getSchedule(req, res) {
        try {
            const schedules = await DataModel.getSchedules();
            // Format output: { "schedules": ["07:00", "12:00", ...] }
            const formatted = schedules.map(row => row.time_format);
            res.status(200).json({ schedules: formatted });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching schedule' });
        }
    },

    // Frontend: Simpan Jadwal Baru
    async saveSchedule(req, res) {
        try {
            const { schedules } = req.body; // Harapannya array ["07:00", "12:00"]
            if (!schedules || !Array.isArray(schedules)) {
                return res.status(400).json({ message: 'Format jadwal salah' });
            }
            
            await DataModel.updateSchedules(schedules);
            res.status(200).json({ message: 'Jadwal berhasil diperbarui' });
        } catch (error) {
            res.status(500).json({ message: 'Error saving schedule' });
        }
    }
};

module.exports = DataController;