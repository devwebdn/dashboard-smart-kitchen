import { Cpu, RefreshCw, WifiOff } from "lucide-react";

function formatLastSeen(ts) {
  if (!ts) return "Tidak diketahui";
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 10) return "Baru saja";
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return new Date(ts).toLocaleDateString("id-ID");
}

function DeviceItem({ device }) {
  const online = device.is_online;
  return (
    <div className={`device-item ${online ? "online" : "offline"}`}>
      <div className="device-icon-wrap">
        {online ? <Cpu size={18} /> : <WifiOff size={18} />}
      </div>
      <div className="device-info">
        <div className="device-name" title={device.name ?? device.id}>
          {device.name ?? device.id}
        </div>
        <div className="device-meta">
          {device.location ?? "—"} · {device.firmware_version ?? ""}
        </div>
        <div className="device-meta" style={{ marginTop: 2 }}>
          Terakhir: {formatLastSeen(device.last_seen)}
        </div>
      </div>
      <span className={`device-badge ${online ? "online" : "offline"}`}>
        <span className="bdot" />
        {online ? "Online" : "Offline"}
      </span>
    </div>
  );
}

export default function DeviceStatus({ devices, loading }) {
  const onlineCount = devices.filter((d) => d.is_online).length;

  return (
    <aside className="panel device-panel">
      <div className="panel-head">
        <div>
          <h3>Status Perangkat</h3>
          <p>{onlineCount}/{devices.length} perangkat online</p>
        </div>
        <span
          style={{
            fontSize: 10,
            color: "var(--gray-400)",
            background: "var(--gray-100)",
            padding: "4px 9px",
            borderRadius: 6,
            fontWeight: 600,
          }}
        >
          {devices.length} unit
        </span>
      </div>

      <div className="device-list">
        {loading && devices.length === 0 ? (
          <div className="device-loading">
            <RefreshCw size={16} className="spin" style={{ color: "var(--gray-400)" }} />
            <p style={{ marginTop: 8 }}>Memuat status perangkat...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="no-devices">
            <WifiOff size={28} style={{ color: "var(--gray-300)" }} />
            <p>
              Tabel <code>devices</code> belum dikonfigurasi di Supabase.
              Data perangkat akan tampil di sini setelah tersedia.
            </p>
          </div>
        ) : (
          devices.map((d) => <DeviceItem key={d.id} device={d} />)
        )}
      </div>

      <div className="device-panel-foot">
        Diperbarui otomatis setiap 30 detik
      </div>
    </aside>
  );
}
