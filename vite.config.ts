// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Unocss from 'unocss/vite'
import { getSecurityHeaders } from './src/lib/securityHeaders'

export default defineConfig({
  plugins: [
    react(),
    Unocss(), // add UnoCSS here
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  server: {
    historyApiFallback: true,
    headers: getSecurityHeaders(),
  },
  preview: {
    headers: getSecurityHeaders(),
  },
  build: {
    rollupOptions: {
      output: {
        // Security: Prevent source map exposure in production
        sourcemap: false,
      },
      external: [],
    },
    // Security: Minify and obfuscate code
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  define: {
    // Security: Remove development-only code
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
})
