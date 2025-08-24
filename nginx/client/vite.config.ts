import { defineConfig } from 'vite'
import path from 'path'

// Use require instead of import for compatibility
const resolve = (dir: string) => path.resolve(__dirname, dir)

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: resolve('index.html')
    }
  },
  resolve: {
    alias: {
      '@': resolve('src'),
      '@components': resolve('src/components'),
      '@assets': resolve('src/assets')
    }
  },
  server: {
    port: 80,
    open: true
  },
  optimizeDeps: {
    esbuildOptions: {
      // Add this to handle ts files in config
      loader: { '.ts': 'ts' }
    }
  }
  
})