import { createClient } from "@supabase/supabase-js";
import config from "./config";

if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
  throw new Error("Missing Supabase configuration environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
