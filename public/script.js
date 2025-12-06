document.addEventListener("DOMContentLoaded", function () {
  
  // ==========================================
  // 1. KONFIGURASI API
  // ==========================================
  // Ganti URL ini dengan URL Ngrok terbaru Anda
  const BASE_URL = "https://c228eccacc4f.ngrok-free.app"; 
  
  const API_URLS = {
    monitor: `${BASE_URL}/api/feeder/data?limit=1`,      // GET: Suhu & Status Servo
    schedule: `${BASE_URL}/api/feeder/schedule`,          // GET & POST: Jadwal
  };

  // ==========================================
  // 2. ELEMENT SELECTORS
  // ==========================================
  // Sidebar
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebarMenu");
  const overlay = document.getElementById("sidebarOverlay");
  const container = document.getElementById("mainContainer");

  // Monitoring UI
  const tempValue = document.querySelector(".temperature-card .sensor-value");
  const chartBar = document.querySelector(".temperature-chart .chart-bar");
  const chartVal = document.querySelector(".temperature-chart .bar-value");
  const servoStatus = document.getElementById("servoStatus"); 
  const lastFeedElement = document.getElementById("lastFeedTime");

  // Schedule UI
  const addBtn = document.getElementById("addScheduleBtn");
  const feedTimeInput = document.getElementById("feedTime");
  const scheduleList = document.getElementById("scheduleList");
  const statusText = document.getElementById("statusText");

  // Local State untuk Jadwal
  let schedules = []; 
  // Variabel bantuan untuk menahan status visual
  let visualHoldTimeout = null;

  // ==========================================
  // 3. SIDEBAR LOGIC
  // ==========================================
  function toggleSidebar() {
    sidebar.classList.toggle("is-open");
    overlay.classList.toggle("is-visible");
    if (container) container.classList.toggle("is-shifted");
  }
  if (menuToggle) menuToggle.addEventListener("click", toggleSidebar);
  if (overlay) overlay.addEventListener("click", toggleSidebar);

  // ==========================================
  // 4. LOGIKA JADWAL (DATABASE CONNECTED)
  // ==========================================

  // A. FUNGSI LOAD JADWAL DARI SERVER (GET)
  async function loadSchedulesFromServer() {
    try {
      const response = await fetch(API_URLS.schedule, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const result = await response.json();
      
      // Asumsi format backend: { "schedules": ["07:00", "12:00"] }
      if (result.schedules && Array.isArray(result.schedules)) {
        schedules = result.schedules;
        updateScheduleUI();
        console.log("Jadwal dimuat dari DB:", schedules);
      }
    } catch (error) {
      console.error("Gagal ambil jadwal:", error);
      statusText.textContent = "Gagal koneksi server.";
    }
  }

  // B. FUNGSI SIMPAN JADWAL KE SERVER (POST)
  async function saveSchedulesToServer() {
    // Ubah tampilan tombol jadi loading sementara
    const originalText = addBtn.textContent;
    addBtn.textContent = "Menyimpan...";
    addBtn.disabled = true;

    try {
      const response = await fetch(API_URLS.schedule, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        // Kita kirim seluruh array jadwal terbaru
        body: JSON.stringify({ schedules: schedules })
      });

      if (response.ok) {
        // alert("Jadwal tersimpan di Database!"); // Opsional
        console.log("Jadwal berhasil di-upload.");
      } else {
        alert("Gagal menyimpan ke database!");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Error koneksi saat menyimpan!");
    } finally {
      // Kembalikan tombol
      addBtn.textContent = originalText;
      addBtn.disabled = false;
    }
  }

  // C. UPDATE TAMPILAN LIST (UI ONLY)
  function updateScheduleUI() {
    scheduleList.innerHTML = ""; 
    
    if (schedules.length === 0) {
      statusText.textContent = "Belum ada jadwal di Database.";
    } else {
      statusText.textContent = `${schedules.length} Jadwal Aktif`;
    }

    schedules.sort(); // Urutkan jam

    schedules.forEach((time, index) => {
      const li = document.createElement("li");
      li.className = "schedule-item";
      li.innerHTML = `
        <span class="schedule-time">
            <i class="far fa-clock"></i> ${time}
        </span>
        <button class="delete-btn" data-index="${index}">Hapus</button>
      `;
      scheduleList.appendChild(li);
    });

    // Event Listener Hapus
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        if(!confirm("Hapus jadwal ini?")) return;

        const indexToDelete = e.target.getAttribute("data-index");
        schedules.splice(indexToDelete, 1); // Hapus dari array lokal
        
        updateScheduleUI(); // Update UI dulu biar responsif
        await saveSchedulesToServer(); // Lalu sinkron ke DB
      });
    });
  }

  // D. EVENT LISTENER TOMBOL TAMBAH
  addBtn.addEventListener("click", async () => {
    const timeVal = feedTimeInput.value;
    
    if (!timeVal) {
      alert("Pilih jam dulu!");
      return;
    }
    if (schedules.includes(timeVal)) {
      alert("Jadwal sudah ada!");
      return;
    }

    schedules.push(timeVal); // Masukkan ke array lokal
    updateScheduleUI(); // Update UI
    feedTimeInput.value = ""; // Reset form

    await saveSchedulesToServer(); // KIRIM KE DATABASE
  });

  // ==========================================
  // 5. MONITORING REALTIME (SUHU & UPDATE STATUS)
  // ==========================================
  async function fetchMonitorData() {
    try {
      const response = await fetch(API_URLS.monitor, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const result = await response.json();
      
      let data = Array.isArray(result.data) ? result.data[0] : result.data;

      if (data) {
        // --- 1. Update Suhu (Sama seperti sebelumnya) ---
        const temp = parseFloat(data.temperature);
        if (!isNaN(temp)) {
          if (tempValue) tempValue.textContent = temp.toFixed(1);
          const pct = Math.min(100, Math.max(0, (temp / 40) * 100));
          if (chartBar) chartBar.style.height = `${pct}%`;
          if (chartVal) chartVal.textContent = `${temp.toFixed(1)}°C`;
        }

        // --- 2. Update Status Pakan (DIPERBAIKI) ---
        if (servoStatus && data.servo_status) {
            
            // JIKA STATUS DARI DATABASE "ON"
            if(data.servo_status === "ON") {
                // Tampilkan visual ON
                showServoActive(data.created_at);
            } 
            // JIKA STATUS "OFF", TAPI JANGAN LANGSUNG MATIKAN JIKA SEDANG HOLD
            else if (data.servo_status === "OFF" && !visualHoldTimeout) {
                servoStatus.textContent = "OFF";
                servoStatus.classList.remove("active");
                servoStatus.style.color = "#333";
            }
        }
      }
    } catch (e) {
      console.error("Monitoring fetch error", e);
    }
  }

  function showServoActive(timestampStr) {
    // 1. Ubah Teks & Warna
    servoStatus.textContent = "MEMBERI PAKAN...";
    servoStatus.classList.add("active");
    servoStatus.style.color = "#8c6fe9"; // Warna Ungu/Primary
    
    // 2. Update Waktu Terakhir
    if(lastFeedElement && timestampStr) {
        const date = new Date(timestampStr);
        lastFeedElement.textContent = date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
    }

    // 3. Tahan status ini selama 10 detik, lalu kembalikan ke OFF
    // (Biar user sempat lihat meskipun di database sudah kembali OFF)
    if (visualHoldTimeout) clearTimeout(visualHoldTimeout); // Reset timer jika ada trigger baru
    
    visualHoldTimeout = setTimeout(() => {
        servoStatus.textContent = "OFF";
        servoStatus.classList.remove("active");
        servoStatus.style.color = "#333";
        visualHoldTimeout = null; // Hapus timer
    }, 10000); // Tahan selama 10.000 ms (10 detik)
  }

  // ==========================================
  // 6. INIT (STARTUP)
  // ==========================================
  loadSchedulesFromServer(); // Ambil jadwal dari DB saat web dibuka
  
  // Polling data monitoring setiap 3 detik
  fetchMonitorData();
  setInterval(fetchMonitorData, 3000);
});