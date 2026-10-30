import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./supabase";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import "./styles.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      // Tidak ada konfigurasi Supabase — langsung ke demo/login
      setLoading(false);
      return;
    }

    // Cek session yang sudah ada
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    // Dengarkan perubahan auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    if (supabaseConfigured) await supabase.auth.signOut();
    setSession(null);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-inner">
          <div className="loading-spinner" />
          <span className="loading-label">Memuat MBG Monitor...</span>
        </div>
      </div>
    );
  }

  // Belum login → tampilkan halaman login
  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  // Sudah login → tampilkan dashboard
  return <DashboardPage session={session} onLogout={handleLogout} />;
}
