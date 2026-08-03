import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

// Standard client-only frontend Vite SPA configuration with separated Web Mocks
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "react-native": "react-native-web",
      "react-native-safe-area-context": path.resolve(__dirname, "./src/lib/web-mocks.tsx"),
      "react-native-svg": path.resolve(__dirname, "./src/lib/svg-mocks.tsx"),
      "expo-linear-gradient": path.resolve(__dirname, "./src/lib/web-mocks.tsx"),
      "@expo/vector-icons": path.resolve(__dirname, "./src/lib/web-mocks.tsx"),
      "expo-status-bar": path.resolve(__dirname, "./src/lib/web-mocks.tsx"),
    },
  },
  build: {
    outDir: "dist",
  },
});
