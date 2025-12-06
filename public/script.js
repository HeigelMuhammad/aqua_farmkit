document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebarMenu");
  const overlay = document.getElementById("sidebarOverlay");
  const body = document.body;

  // Fungsi untuk membuka sidebar
  function openSidebar() {
    sidebar.style.left = "0"; // Pindahkan sidebar ke dalam layar
    body.classList.add("is-shifted"); // Tambahkan kelas untuk menggeser konten & menampilkan overlay
  }

  // Fungsi untuk menutup sidebar
  function closeSidebar() {
    sidebar.style.left = "-300px"; // Sembunyikan sidebar
    body.classList.remove("is-shifted"); // Hapus kelas untuk mengembalikan konten & menyembunyikan overlay
  }

  // Event Listener untuk Tombol Burger
  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      // Periksa apakah body memiliki kelas is-shifted
      if (body.classList.contains("is-shifted")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  // Event Listener untuk Overlay (klik di luar menu)
  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  // ========== FETCH DATA TEMPERATURE ==========
  const API_BASE_URL = "https://cc7dc8e3c39d.ngrok-free.app/api/feeder";
  const API_LATEST_URL = `${API_BASE_URL}/latest`;
  const temperatureValueElement = document.querySelector(".temperature-card .sensor-value");
  const temperatureStatusElement = document.querySelector(".temperature-card .sensor-status-value");
  const chartBarElement = document.querySelector(".temperature-chart .chart-bar");
  const barValueElement = document.querySelector(".temperature-chart .bar-value");

  // Fungsi untuk fetch data temperature terbaru dari API
  async function fetchTemperatureData() {
    try {
      // Menambahkan header untuk ngrok (jika diperlukan)
      const response = await fetch(API_LATEST_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' // Header untuk skip warning ngrok
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.data) {
        const latestData = result.data;
        const temperature = parseFloat(latestData.temperature);
        const servoStatus = latestData.servo_status;
        
        // Validasi temperature
        if (isNaN(temperature)) {
          throw new Error('Temperature tidak valid');
        }
        
        // Update temperature value
        if (temperatureValueElement) {
          temperatureValueElement.textContent = temperature.toFixed(1);
        }
        
        // Update status
        if (temperatureStatusElement) {
          temperatureStatusElement.textContent = servoStatus === "on" ? "Aktif" : "Nonaktif";
        }
        
        // Update chart bar (asumsi range 0-40°C untuk visualisasi)
        if (chartBarElement && barValueElement) {
          const maxTemp = 40;
          const minTemp = 0;
          const percentage = ((temperature - minTemp) / (maxTemp - minTemp)) * 100;
          const clampedPercentage = Math.max(0, Math.min(100, percentage));
          
          chartBarElement.style.height = `${clampedPercentage}%`;
          barValueElement.textContent = `${temperature.toFixed(1)}°C`;
        }
        
        console.log("Data temperature berhasil di-update:", temperature, "°C");
      } else {
        console.warn("Tidak ada data temperature tersedia");
        if (temperatureValueElement) {
          temperatureValueElement.textContent = "-";
        }
        if (temperatureStatusElement) {
          temperatureStatusElement.textContent = "-";
        }
      }
    } catch (error) {
      console.error("Error fetching temperature data:", error);
      if (temperatureValueElement) {
        temperatureValueElement.textContent = "Error";
      }
      if (temperatureStatusElement) {
        temperatureStatusElement.textContent = "Error";
      }
    }
  }

  // Fungsi untuk fetch data temperature berdasarkan ID
  async function fetchTemperatureDataById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.data) {
        const data = result.data;
        const temperature = parseFloat(data.temperature);
        const servoStatus = data.servo_status;
        
        // Update UI dengan data dari ID tertentu
        if (temperatureValueElement) {
          temperatureValueElement.textContent = temperature.toFixed(1);
        }
        
        if (temperatureStatusElement) {
          temperatureStatusElement.textContent = servoStatus === "on" ? "Aktif" : "Nonaktif";
        }
        
        console.log(`Data temperature ID ${id} berhasil di-update:`, temperature, "°C");
        return result.data;
      } else {
        console.warn(`Data dengan ID ${id} tidak ditemukan`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching temperature data by ID ${id}:`, error);
      return null;
    }
  }

  // Fetch data pertama kali saat halaman dimuat
  fetchTemperatureData();

  // Auto-refresh setiap 5 detik untuk real-time update
  setInterval(fetchTemperatureData, 5000);
});
