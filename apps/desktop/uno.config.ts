import { defineConfig } from 'unocss'
import baseConfig from '../../packages/ui/uno.config'

export default defineConfig({
  ...baseConfig,
  content: {
    filesystem: [
      './src/**/*.{vue,ts,tsx}',
      '../../packages/ui/src/**/*.{vue,ts,tsx}',
    ],
  },
})
