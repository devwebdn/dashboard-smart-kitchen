import { ShieldCheck } from "lucide-react";

function formatTime(reading) {
  if (reading.recorded_at) {
    return new Date(reading.recorded_at).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return `${reading.time ?? "—"} WIB`;
}

function StatusPill({ active, activeLabel = "Terdeteksi", inactiveLabel = "Normal" }) {
  return (
    <span className={`s-pill ${active ? "danger" : "ok"}`}>
      <i />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export default function HistoryTable({ readings }) {
  const rows = [...readings].reverse().slice(0, 10);

  return (
    <section className="panel history-panel" id="history">
      <div className="panel-head">
        <div>
          <h3>Riwayat Pembacaan</h3>
          <p>Data sensor terakhir yang tersedia dari perangkat</p>
        </div>
        <span className="count-badge">{readings.length} catatan</span>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Suhu</th>
              <th>Kelembapan</th>
              <th>Gas / Asap (ADC)</th>
              <th>Deteksi Gas</th>
              <th>Suhu Naik</th>
              <th>Alarm</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.recorded_at ?? r.time}-${i}`}>
                <td className="td-time">{formatTime(r)}</td>
                <td className="td-temp">{Number(r.temperature).toFixed(1)} °C</td>
                <td className="td-hum">{Number(r.humidity).toFixed(1)}%</td>
                <td className="td-gas">{r.gas_adc ?? "—"}</td>
                <td><StatusPill active={r.gas_detected} /></td>
                <td><StatusPill active={r.suhu_naik} activeLabel="Naik" inactiveLabel="Stabil" /></td>
                <td><StatusPill active={r.alarm_active} activeLabel="Aktif" inactiveLabel="Aman" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-foot">
        <span>Menampilkan hingga 10 data terbaru</span>
        <span className="tf-right">
          <ShieldCheck size={13} />
          Pemantauan lingkungan dapur MBG
        </span>
      </div>
    </section>
  );
}
