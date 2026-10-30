import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";

function formatDate() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function initials(email) {
  if (!email) return "MB";
  const parts = email.split("@")[0].split(/[._-]/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "MB";
}

export default function Topbar({ onMenuOpen, user, onLogout, hasAlarm }) {
  const isDemo = user?.demo;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onMenuOpen} aria-label="Buka menu">
          <Menu size={20} />
        </button>
        <div>
          <div className="topbar-eyebrow">Sistem Pemantauan</div>
          <h1 className="topbar-title-h1">Dashboard</h1>
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-date">{formatDate()}</span>

        <button
          className="topbar-icon-btn"
          aria-label={`Notifikasi${hasAlarm ? " — alarm aktif" : ""}`}
          title="Notifikasi"
        >
          <Bell size={18} />
          {hasAlarm && <span className="notif-dot" />}
        </button>

        <button className="topbar-user-btn" aria-label="Menu akun">
          <div className="topbar-avatar">{initials(user?.email)}</div>
          <div className="topbar-user-text">
            <strong>{user?.email ?? "Operator"}</strong>
            <span>{isDemo ? "Mode demo" : "Terautentikasi"}</span>
          </div>
          <ChevronDown size={13} style={{ color: "var(--gray-400)" }} />
        </button>

        {!isDemo && user && (
          <button
            className="topbar-icon-btn"
            onClick={onLogout}
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  );
}
