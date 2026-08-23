import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
  (typeof window !== "undefined" && (window as any).env?.VITE_SUPABASE_URL) ||
  "https://kheeiiirpsiftgcdsblr.supabase.co";

const supabaseAnonKey =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof window !== "undefined" && (window as any).env?.VITE_SUPABASE_ANON_KEY) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZWVpaWlycHNpZnRnY2RzYmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDU0OTIsImV4cCI6MjA5NDY4MTQ5Mn0.d-WeGt2LV183hew8mOQx3HOZj_cYJlUdm3iNuXbHRUg";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Authentication will not work until they are set.");
}

let supabaseStorage: any = undefined;
if (Platform.OS !== "web") {
  try {
    supabaseStorage = require("@react-native-async-storage/async-storage").default;
  } catch (e) {
    console.warn("Failed to load AsyncStorage for Supabase client:", e);
  }
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      storage: supabaseStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    }
  }
);
