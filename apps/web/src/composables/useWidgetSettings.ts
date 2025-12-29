import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

/**
 * useWidgetSettings
 *
 * Global user preferences for widget display.
 * Note: Module-specific settings (fontSize, showProgress, etc.) are now stored
 * in each widget's module state, not here.
 */

// ============================================
// TYPES
// ============================================

export type VisibilityMode = 'transparent' | 'subtle' | 'visible'

export interface WidgetVisibilitySettings {
  restMode: VisibilityMode
  hoverMode: VisibilityMode
}

// ============================================
// DEFAULTS
// ============================================

const defaultSettings: WidgetVisibilitySettings = {
  restMode: 'transparent',
  hoverMode: 'subtle',
}

// ============================================
// STATE - Using VueUse's useLocalStorage for automatic persistence
// ============================================

const settings = useLocalStorage<WidgetVisibilitySettings>(
  'boardkit:visibility-settings',
  defaultSettings,
  { mergeDefaults: true }
)

// ============================================
// COMPOSABLE
// ============================================

export function useWidgetSettings() {
  const visibility = computed(() => settings.value)

  // Update visibility settings
  const updateVisibility = (updates: Partial<WidgetVisibilitySettings>) => {
    settings.value = { ...settings.value, ...updates }
  }

  // Reset to defaults
  const resetToDefaults = () => {
    settings.value = { ...defaultSettings }
  }

  return {
    visibility,
    updateVisibility,
    resetToDefaults,
  }
}
