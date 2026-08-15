import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";

function normalizeSupabaseUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return "";
    url.pathname = url.pathname.replace(/\/(auth|rest|storage|realtime)\/v1\/?$/, "");
    url.pathname = url.pathname.replace(/\/+$/, "");
    if (url.pathname || url.search || url.hash) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
export const supabaseConfigError = rawSupabaseUrl && !supabaseUrl
  ? "VITE_SUPABASE_URL must be the project URL, for example https://your-project.supabase.co. Do not include /auth/v1, /rest/v1 or other API paths."
  : "";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseConfigError);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
