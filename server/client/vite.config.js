import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure the base path is absolute so assets load correctly on Render
  base: '/', 
  build: {
    // Explicitly set the output directory to 'dist'
    outDir: 'dist',
    // Helps ensure empty folders are cleaned before building
    emptyOutDir: true,
  },
  server: {
    // This helps during local development if you use a proxy
    proxy: {
      '/links': 'http://localhost:5000',
      '/status': 'http://localhost:5000',
    }
  }
})