import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget.tsx'),
      name: 'W9Widget',
      fileName: 'w9-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        // Ensure everything is bundled into a single file
        inlineDynamicImports: true,
        // Global variable name for the widget
        name: 'W9Widget',
        // Extend window object
        extend: true
      }
    },
    // Output to dist folder
    outDir: 'dist',
    // Generate sourcemaps for debugging
    sourcemap: true
  },
  // Development server config
  server: {
    port: 3000,
    open: true
  }
})
