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
    }
};

module.exports = DataController;