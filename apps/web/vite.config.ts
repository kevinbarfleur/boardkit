import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@boardkit/core': resolve(__dirname, '../../packages/core/src'),
      '@boardkit/ui': resolve(__dirname, '../../packages/ui/src'),
      '@boardkit/platform': resolve(__dirname, '../../packages/platform/src'),
    },
  },
  server: {
    port: 3000,
  },
})
