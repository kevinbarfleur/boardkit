import { ref, watch } from 'vue'

const THEME_KEY = 'boardkit-theme'

export type Theme = 'light' | 'dark' | 'system'

const currentTheme = ref<Theme>('system')

export function useTheme() {
  const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved) {
      currentTheme.value = saved
    }
    applyTheme(currentTheme.value)
  }

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
  }

  const toggleTheme = () => {
    const next = currentTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
    }
  }

  // Watch for system preference changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentTheme.value === 'system') {
        applyTheme('system')
      }
    })
  }

  return {
    theme: currentTheme,
    initTheme,
    setTheme,
    toggleTheme,
  }
}
