import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'vendor-pdf': ['@react-pdf/renderer'],
          'vendor-utils': ['date-fns', 'uuid', 'zustand'],
          'vendor-ui': ['lucide-react'],
          pdfjs: ['pdfjs-dist'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',
    assetsDir: 'assets',
    manifest: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
      '@react-pdf/renderer',
      'date-fns',
      'uuid',
      'zustand',
      'lucide-react',
      'pdfjs-dist'
    ],
    exclude: ['pdfjs-dist/build/pdf.worker.min.js']
  },
  resolve: {
    alias: {
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.js'
    }
  }
});