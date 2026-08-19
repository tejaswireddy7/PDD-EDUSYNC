import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.EXPO_PUBLIC_VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  (typeof window !== "undefined" && (window as any).env?.VITE_SUPABASE_URL) ||
  "";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  (typeof window !== "undefined" && (window as any).env?.VITE_SUPABASE_ANON_KEY) ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Authentication will not work until they are set.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
