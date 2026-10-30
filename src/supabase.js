import { createClient } from "@supabase/supabase-js";

const urlEnv = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Format key baru Supabase (sb_publishable_xxx) — URL bisa didapat dari key
function extractUrlFromKey(k) {
  if (!k || !k.startsWith("sb_publishable_")) return null;
  // Format: sb_publishable_[projectRef]_[suffix]
  // Project ref ada di bagian tengah key
  const withoutPrefix = k.replace("sb_publishable_", "");
  // Ambil bagian sebelum underscore terakhir sebagai project ref
  const lastUnderscore = withoutPrefix.lastIndexOf("_");
  if (lastUnderscore === -1) return null;
  const projectRef = withoutPrefix.substring(0, lastUnderscore);
  return `https://${projectRef}.supabase.co`;
}

// Gunakan URL dari env jika ada dan valid, atau derive dari key
function resolveUrl() {
  if (urlEnv && urlEnv.includes("supabase.co") && !urlEnv.includes("YOUR_PROJECT_REF")) {
    return urlEnv;
  }
  return extractUrlFromKey(key);
}

const url = resolveUrl();

export const supabaseConfigured = Boolean(url && key);
export const supabase = supabaseConfigured ? createClient(url, key) : null;
