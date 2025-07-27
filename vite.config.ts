import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && !process.env.VITE_DISABLE_TAGGER && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 🔐 Prevent usage of eval() to fix CSP issues
  build: {
    sourcemap: false, // avoids source maps that may use eval
  },
  esbuild: {
    legalComments: 'none', // remove comments that may use eval
  },
  define: {
    'process.env': {}, // prevent dynamic environment resolution using eval
  },
}));
