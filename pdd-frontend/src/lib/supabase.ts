import { createClient } from "@supabase/supabase-js";

const getEnvVar = (key: string): string => {
  const expoKey = "EXPO_PUBLIC_" + key.replace("VITE_", "");
  if (typeof process !== "undefined" && process.env) {
    if (process.env[expoKey]) return process.env[expoKey];
    if (process.env[key]) return process.env[key];
  }
  if (typeof window !== "undefined" && (window as any).env && (window as any).env[key]) {
    return (window as any).env[key];
  }
  return "";
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Authentication will not work until they are set.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
