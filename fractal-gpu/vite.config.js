import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['gl-matrix']
        }
      }
    }
  },
  assetsInclude: ['**/*.frag', '**/*.vert', '**/*.glsl']
})