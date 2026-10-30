# Monitoring Dapur MBG 🍳🔥

Sistem monitoring keamanan dan lingkungan dapur berbasis **IoT (ESP8266 NodeMCU)** dan **Web Dashboard Realtime (React + Vite + Supabase)**. Sistem ini memantau kebocoran gas (LPG/asap), suhu, dan kelembaban secara kontinu dengan peringatan dini (alarm buzzer & notifikasi).

---

## 📁 Struktur Repositori

```text
monitoring-dapur-mbg/
├── iot/
│   └── monitoring_iot_esp8266/
│       └── monitoring_iot_esp8266.ino   # Firmware Arduino ESP8266
├── src/                                  # Source code frontend (React + Vite)
│   ├── components/                       # Komponen UI dashboard
│   ├── hooks/                            # Custom React hook untuk data sensor & realtime
│   ├── pages/                            # Halaman Dashboard & Login
│   ├── styles.css                        # Styling antarmuka
│   ├── supabase.js                       # Client Supabase
│   └── ...
├── supabase/
│   └── schema.sql                        # Skema database & konfigurasi RLS Supabase
├── .env.example                          # Template konfigurasi environment variables
├── .gitignore                            # Berkas yang dikecualikan dari Git
├── index.html                            # Entry point HTML Vite
├── package.json                          # Manifest dependensi project
└── vite.config.js                        # Konfigurasi Vite
```

---

## 🚀 Panduan Memulai

### 1. Persiapan Database (Supabase)

1. Buat project baru di [Supabase](https://supabase.com).
2. Masuk ke menu **SQL Editor** -> **New Query**.
3. Salin seluruh isi berkas [`supabase/schema.sql`](supabase/schema.sql) dan jalankan (**Run**).
4. Masuk ke **Project Settings** -> **API** untuk mendapatkan:
   - **Project URL**
   - **anon / public key**

---

### 2. Menjalankan Web Dashboard (Frontend)

1. Pastikan telah menginstal [Node.js](https://nodejs.org/) (versi LTS direkomendasikan).
2. Salin template environment:
   ```bash
   cp .env.example .env
   ```
3. Buka file `.env` dan isi dengan konfigurasi Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_publishable_key
   VITE_LOGIN_EMAIL=admin@example.com
   VITE_LOGIN_PASSWORD=your_secure_password
   ```
4. Pasang dependensi dan jalankan development server:
   ```bash
   npm install
   npm run dev
   ```
5. Akses dashboard di browser pada URL yang muncul (biasanya `http://localhost:5173`).

> *Catatan: Jika Supabase belum dikonfigurasi, dashboard otomatis berjalan dalam **Mode Simulasi**.*

---

### 3. Firmware Perangkat IoT (ESP8266 NodeMCU)

1. Buka Arduino IDE.
2. Pastikan board package **ESP8266** sudah terinstal melalui *Boards Manager*.
3. Pasang library yang dibutuhkan via *Library Manager*:
   - `DHT sensor library` (oleh Adafruit)
   - `LiquidCrystal I2C`
   - `UniversalTelegramBot` (opsional jika menggunakan Telegram)
   - `ArduinoJson`
4. Buka berkas sketch di [`iot/monitoring_iot_esp8266/monitoring_iot_esp8266.ino`](iot/monitoring_iot_esp8266/monitoring_iot_esp8266.ino).
5. Sesuaikan konstanta koneksi pada bagian atas sketch:
   - `WIFI_SSID` & `WIFI_PASSWORD`
   - `SUPABASE_URL` & `SUPABASE_KEY`
   - `DEVICE_ID`
6. Sambungkan NodeMCU ESP8266 dan lakukan **Upload**.

---

## 🔒 Catatan Keamanan Sebelum Unggah ke GitHub

- Berkas `.env` telah dimasukkan ke dalam `.gitignore` sehingga data rahasia (API Key, password) tidak akan terunggah ke repositori.
- Jangan pernah mengunggah `service_role` key Supabase ke frontend.
- Jika repositori diatur ke **Public**, pastikan Anda tidak mengekspos kata sandi WiFi pribadi di dalam file sketch Arduino, atau pilih visibilitas repositori sebagai **Private**.
