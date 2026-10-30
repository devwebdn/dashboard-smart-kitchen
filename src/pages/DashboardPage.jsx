import { useMemo, useState } from "react";
import { AlertTriangle, Cloud, Flame, RefreshCw, ShieldCheck, Thermometer, Waves, Wind, Wifi } from "lucide-react";
import { useSensorData } from "../hooks/useSensorData";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import MetricCard from "../components/MetricCard";
import { DualChart, GasChart, HumidityPanel, TemperatureChart } from "../components/SensorChart";
import HistoryTable from "../components/HistoryTable";
import DeviceStatus from "../components/DeviceStatus";

export default function DashboardPage({ session, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const { readings, devices, source, loading, error, lastUpdated, refresh } = useSensorData();

  const user = session?.user ?? session;

  // Latest reading
  const latest = readings[readings.length - 1] ?? {};
  const alarm = Boolean(latest.alarm_active || latest.gas_detected);

  // Chart data — normalize time label
  const chartData = useMemo(
    () =>
      readings.map((r) => ({
        ...r,
        time:
          r.time ??
          (r.recorded_at
            ? new Date(r.recorded_at)
                .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                .replace(":", ".")
            : "—"),
        temperature: Number(r.temperature),
        humidity: Number(r.humidity),
        gas_adc: Number(r.gas_adc ?? 0),
      })),
    [readings]
  );

  // Scroll helpers
  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNavigate(section) {
    setActiveSection(section);
    if (section === "analytics") scrollTo("analytics");
    if (section === "history") scrollTo("history");
  }

  const tempVal = Number(latest.temperature ?? 0).toFixed(1);
  const humVal  = Number(latest.humidity ?? 0).toFixed(1);
  const gasVal  = latest.gas_adc ?? 0;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={onLogout}
        devices={devices}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Scrim overlay on mobile */}
      {sidebarOpen && (
        <button
          className="scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup menu"
        />
      )}

      {/* Main Content */}
      <div className="main-content">
        <Topbar
          onMenuOpen={() => setSidebarOpen(true)}
          user={user}
          onLogout={onLogout}
          hasAlarm={alarm}
        />

        <div className="page-content fade-up">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="wb-text">
              <h2>Selamat datang 👋</h2>
              <p>Pantau kondisi lingkungan dapur MBG dalam satu tampilan real-time.</p>
            </div>
            <div className="wb-actions">
              <span className={`source-pill ${source === "supabase" ? "live" : "demo"}`}>
                <span className="pill-dot" />
                {source === "supabase" ? "Data Langsung" : "Mode Simulasi"}
              </span>
              <button className="refresh-btn" onClick={refresh} disabled={loading}>
                <RefreshCw size={14} className={loading ? "spin" : ""} />
                Perbarui
              </button>
            </div>
          </div>

          {/* Demo notice */}
          {source === "demo" && (
            <div className="demo-notice">
              <Cloud size={16} />
              <span>
                <strong>Mode pratinjau aktif.</strong> Nilai sensor di bawah adalah simulasi.
                Isi konfigurasi Supabase untuk menampilkan data perangkat nyata.
              </span>
            </div>
          )}

          {/* Error notice (mis. RLS blocking) */}
          {error && source === "supabase" && (
            <div className="demo-notice" style={{ borderColor: "#f87171", background: "rgba(239,68,68,0.08)" }}>
              <AlertTriangle size={16} style={{ color: "#f87171", flexShrink: 0 }} />
              <span>
                <strong>Gagal membaca data:</strong> {error}. Pastikan RLS policy sudah diatur di Supabase.
              </span>
            </div>
          )}

          {/* Waiting for sensor data */}
          {!error && source === "supabase" && !loading && readings.length === 0 && (
            <div className="demo-notice" style={{ borderColor: "#60a5fa", background: "rgba(96,165,250,0.08)" }}>
              <Wifi size={16} style={{ color: "#60a5fa", flexShrink: 0 }} />
              <span>
                <strong>Terhubung ke Supabase.</strong> Menunggu data dari perangkat IoT...
                Pastikan sensor sudah aktif dan mengirim data ke tabel <code>sensor_readings</code>.
              </span>
            </div>
          )}

          {/* Section header */}
          <div className="section-header">
            <div className="section-header-left">
              <h3>Ringkasan Kondisi</h3>
              <p>
                Perangkat <strong>MBG-001</strong> · Dapur MBG
              </p>
            </div>
            <span className="updated-tag">
              Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Metric Cards */}
          <div className="metrics-grid">
            <MetricCard
              icon={Thermometer}
              title="Suhu Lingkungan"
              value={tempVal}
              unit="°C"
              desc="Suhu sekitar area dapur MBG"
              tone="orange"
              badge={{
                label: Number(tempVal) >= 35 ? "Perhatian" : "Normal",
                kind: Number(tempVal) >= 35 ? "warning" : "good",
              }}
            />
            <MetricCard
              icon={Waves}
              title="Kelembapan"
              value={humVal}
              unit="%"
              desc="Kelembapan udara area dapur"
              tone="blue"
              badge={{
                label: Number(humVal) > 80 ? "Tinggi" : Number(humVal) < 30 ? "Rendah" : "Normal",
                kind: Number(humVal) > 80 || Number(humVal) < 30 ? "warning" : "good",
              }}
            />
            <MetricCard
              icon={Wind}
              title="Indeks Gas / Asap"
              value={gasVal}
              unit=" ADC"
              desc="Nilai analog sensor MQ-02"
              tone="purple"
              badge={{
                label: latest.gas_detected ? "Terdeteksi!" : "Normal",
                kind: latest.gas_detected ? "danger" : "good",
              }}
            />
            <MetricCard
              icon={alarm ? Flame : ShieldCheck}
              title="Status Alarm"
              value={alarm ? "Aktif" : "Aman"}
              unit=""
              desc={alarm ? "Periksa area dapur segera!" : "Tidak ada indikasi bahaya"}
              tone={alarm ? "red" : "green"}
              badge={{
                label: alarm ? "Periksa area" : "Tidak ada alarm",
                kind: alarm ? "danger" : "good",
              }}
            />
          </div>

          {/* Charts + Device Status */}
          <div className="content-grid">
            {/* Charts Column */}
            <div className="charts-col">
              <DualChart data={chartData} />
              <GasChart data={chartData} />
            </div>

            {/* Device Status */}
            <DeviceStatus devices={devices} loading={loading} />
          </div>

          {/* History Table */}
          <HistoryTable readings={readings} />
        </div>

        <footer className="page-footer">
          <span>© 2026 MBG Monitor — Sistem Pemantauan Dapur</span>
          <span>Perangkat MBG-001 · Dapur MBG</span>
        </footer>
      </div>
    </div>
  );
}
