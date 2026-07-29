import { createClient } from "@supabase/supabase-js";
import config from "./config";

export const isSupabaseConfigured = !!(
  config.supabaseUrl &&
  config.supabaseServiceRoleKey &&
  config.supabaseUrl !== "placeholder-url" &&
  !config.supabaseUrl.includes("your_supabase_url")
);

if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase environment variables are missing or placeholders. Running backend in local in-memory fallback mode.");
}

const supabaseUrl = isSupabaseConfigured ? config.supabaseUrl : "https://placeholder-url.supabase.co";
const supabaseServiceRoleKey = isSupabaseConfigured ? config.supabaseServiceRoleKey : "placeholder-service-role-key";

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
