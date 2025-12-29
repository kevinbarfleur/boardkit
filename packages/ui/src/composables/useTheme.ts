import { computed, watch } from 'vue'
import { useStorage, usePreferredDark } from '@vueuse/core'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'boardkit-theme'

// Persistent theme preference with VueUse
const storedTheme = useStorage<Theme>(THEME_KEY, 'system')

// System preference detection with VueUse
const prefersDark = usePreferredDark()

export function useTheme() {
  // Computed actual theme (resolved from 'system')
  const resolvedTheme = computed(() => {
    if (storedTheme.value === 'system') {
      return prefersDark.value ? 'dark' : 'light'
    }
    return storedTheme.value
  })

  // Apply theme to document
  const applyTheme = () => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme.value)
  }

  // Watch for changes and apply automatically
  watch(resolvedTheme, applyTheme, { immediate: true })

  const setTheme = (theme: Theme) => {
    storedTheme.value = theme
  }

  const toggleTheme = () => {
    const current = storedTheme.value === 'system' ? resolvedTheme.value : storedTheme.value
    setTheme(current === 'dark' ? 'light' : 'dark')
  }

  const initTheme = () => {
    applyTheme()
  }

  return {
    theme: storedTheme,
    resolvedTheme,
    initTheme,
    setTheme,
    toggleTheme,
  }
}
