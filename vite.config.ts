import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: any[] = [react()];
  if (mode === "development") {
    const tagger = componentTagger();
    if (Array.isArray(tagger)) {
      plugins.push(...tagger);
    } else {
      plugins.push(tagger);
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["sonner", "jspdf", "html2canvas", "docx", "file-saver"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React core - loaded on every page
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI framework - loaded on most pages
            'radix-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-popover',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-accordion',
              '@radix-ui/react-collapsible',
            ],
            // Charts - only loaded on pages with charts (large library)
            'charts': ['recharts', 'd3-scale', 'd3-shape', 'd3-path'],
            // Animation - defer loading
            'animation': ['framer-motion'],
            // PDF/Export - only loaded on export pages
            'export': ['jspdf', 'html2canvas', 'docx', 'file-saver'],
            // Data fetching
            'data': ['@tanstack/react-query', '@supabase/supabase-js'],
            // Error tracking
            'monitoring': ['@sentry/react'],
            // Date utilities
            'date': ['date-fns'],
          },
        },
      },
    },
  };
});
