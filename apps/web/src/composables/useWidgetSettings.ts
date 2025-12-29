import { ref, computed, watch } from 'vue'

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
// STATE
// ============================================

const settings = ref<WidgetVisibilitySettings>(loadSettings())

function loadSettings(): WidgetVisibilitySettings {
  try {
    const saved = localStorage.getItem('boardkit:visibility-settings')
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.warn('Failed to load visibility settings:', e)
  }
  return { ...defaultSettings }
}

function saveSettings() {
  try {
    localStorage.setItem('boardkit:visibility-settings', JSON.stringify(settings.value))
  } catch (e) {
    console.warn('Failed to save visibility settings:', e)
  }
}

// Auto-save on changes
watch(settings, saveSettings, { deep: true })

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
