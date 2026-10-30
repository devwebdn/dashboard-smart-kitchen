import { useState } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { supabase, supabaseConfigured } from "../supabase";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!supabaseConfigured) {
      setError("Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.local terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;
      onLogin(data.session);
    } catch (err) {
      setError(err.message || "Login gagal. Periksa email dan kata sandi Anda.");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoAccess() {
    // Masuk ke mode demo (tanpa autentikasi)
    onLogin({ user: { email: "demo@mbgmonitor.local" }, demo: true });
  }

  return (
    <div className="login-page">
      {/* ── Left Decorative Panel ── */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-mark">
            <Activity size={22} />
          </div>
          <div className="login-brand-text">
            <strong>MBG Monitor</strong>
            <span>Kitchen Safety System</span>
          </div>
        </div>

        <div className="login-hero">
          <h1>
            Pantau dapur Anda<br />
            <em>lebih cerdas.</em>
          </h1>
          <p>
            Sistem pemantauan sensor real-time untuk suhu, kelembapan, dan
            deteksi gas — langsung dari perangkat MBG ke layar Anda.
          </p>
        </div>

        <div className="login-float-cards">
          <div className="lf-card">
            <div className="lf-card-label">Suhu</div>
            <div className="lf-card-value">27.4°C</div>
            <span className="lf-card-badge ok">Normal</span>
          </div>
          <div className="lf-card">
            <div className="lf-card-label">Gas / Asap</div>
            <div className="lf-card-value">108 ADC</div>
            <span className="lf-card-badge safe">Aman</span>
          </div>
          <div className="lf-card">
            <div className="lf-card-label">Kelembapan</div>
            <div className="lf-card-value">57%</div>
            <span className="lf-card-badge safe">Terpantau</span>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="login-right">
        <div className="login-form-box fade-up">
          <div className="login-form-box-header">
            <h2>Masuk ke MBG Monitor</h2>
            <p>Gunakan akun Supabase Anda untuk mengakses data sensor secara lengkap.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="login-email">Alamat Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Kata Sandi</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                required
                autoComplete="current-password"
              />
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : null}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {error && (
            <div className="login-error" role="alert">
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {!supabaseConfigured && (
            <div className="login-hint">
              <strong>Konfigurasi belum lengkap.</strong> Buat file{" "}
              <code>.env.local</code> di root proyek dan isi{" "}
              <code>VITE_SUPABASE_URL</code> serta{" "}
              <code>VITE_SUPABASE_ANON_KEY</code>.
            </div>
          )}

          <div className="login-divider">
            <span>atau</span>
          </div>

          <button className="demo-btn" type="button" onClick={handleDemoAccess}>
            Lanjutkan dengan data simulasi (demo)
          </button>
        </div>
      </div>
    </div>
  );
}
