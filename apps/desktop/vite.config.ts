import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [UnoCSS(), vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@boardkit/core': resolve(__dirname, '../../packages/core/src'),
      '@boardkit/ui': resolve(__dirname, '../../packages/ui/src'),
      '@boardkit/platform': resolve(__dirname, '../../packages/platform/src'),
    },
  },
  server: {
    port: 3001,
    strictPort: true,
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
