import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' is critical. Setting it to '/' ensures that the HTML 
  // looks for scripts at the root, which matches your Express static path.
  base: '/',
  build: {
    // This tells Vite to put the final files in the 'dist' folder
    outDir: 'dist',
    // Clears the folder before each build to prevent old files from lingering
    emptyOutDir: true,
  },
  server: {
    // This allows you to test locally by proxying API calls to your local Express server
    proxy: {
      '/links': 'http://localhost:5000',
      '/status': 'http://localhost:5000',
    },
  },
})