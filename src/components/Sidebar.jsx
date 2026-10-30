import { Activity, Clock3, LayoutDashboard, LogOut, Wifi, X } from "lucide-react";

export default function Sidebar({ open, onClose, user, onLogout, devices, activeSection, onNavigate }) {
  // Status perangkat utama
  const primaryDevice = devices?.[0];
  const isOnline = primaryDevice?.is_online ?? false;
  const dotClass = primaryDevice ? (isOnline ? "online" : "offline") : "unknown";

  // Format last seen
  function formatLastSeen(ts) {
    if (!ts) return "—";
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return "Baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  // Inisial dari email
  function initials(email) {
    if (!email) return "MB";
    const parts = email.split("@")[0].split(/[._-]/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "MB";
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Analitik sensor", icon: Activity },
    { id: "history", label: "Riwayat data", icon: Clock3 },
  ];

  return (
    <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Navigasi sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <Activity size={20} />
          </div>
          <div className="sidebar-brand-text">
            <strong>MBG Monitor</strong>
            <span>Kitchen safety system</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Menu Utama</span>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activeSection === id ? "active" : ""}`}
            onClick={() => { onNavigate(id); onClose(); }}
            aria-current={activeSection === id ? "page" : undefined}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Device status mini card */}
        <div className="sb-device-card">
          <div className="sb-device-card-top">
            <span className="sb-device-card-label">Status Perangkat</span>
            <span className={`sb-pulse-dot ${dotClass}`} />
          </div>
          {primaryDevice ? (
            <>
              <div className="sb-device-name">{primaryDevice.name ?? primaryDevice.id}</div>
              <div className="sb-device-meta">
                {isOnline ? (
                  <>
                    <Wifi size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                    Online · {formatLastSeen(primaryDevice.last_seen)}
                  </>
                ) : (
                  `Offline · ${formatLastSeen(primaryDevice.last_seen)}`
                )}
              </div>
            </>
          ) : (
            <>
              <div className="sb-device-name">MBG-001</div>
              <div className="sb-device-meta">Mode simulasi</div>
            </>
          )}
        </div>

        {/* Profile row */}
        <div className="sb-profile">
          <div className="sb-avatar">{initials(user?.email)}</div>
          <div className="sb-profile-info">
            <strong title={user?.email}>{user?.email ?? "Operator Dapur"}</strong>
            <span>{user?.demo ? "Mode pratinjau" : "Akun terautentikasi"}</span>
          </div>
          {!user?.demo && user && (
            <button className="sb-logout-btn" onClick={onLogout} title="Keluar">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
