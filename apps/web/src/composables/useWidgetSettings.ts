import { ref, computed, watch } from 'vue'
import { useBoardStore } from '@boardkit/core'

// ============================================
// TYPES
// ============================================

export type VisibilityMode = 'transparent' | 'subtle' | 'visible'

export interface WidgetVisibilitySettings {
  restMode: VisibilityMode
  hoverMode: VisibilityMode
  shareAcrossType: boolean
}

export interface TextModuleSettings {
  fontSize: 'small' | 'medium' | 'large'
  lineHeight: 'compact' | 'normal' | 'spacious'
  enableShortcuts: boolean
  autoLinks: boolean
  smartTypography: boolean
  placeholder: string
}

export interface TodoModuleSettings {
  strikeCompleted: boolean
  hideCompleted: boolean
  autoSort: boolean
  showProgress: 'none' | 'bar' | 'counter'
  enableReorder: boolean
}

export interface WidgetSettings {
  visibility: WidgetVisibilitySettings
  text: TextModuleSettings
  todo: TodoModuleSettings
}

// ============================================
// DEFAULTS
// ============================================

const defaultSettings: WidgetSettings = {
  visibility: {
    restMode: 'transparent',
    hoverMode: 'subtle',
    shareAcrossType: true,
  },
  text: {
    fontSize: 'medium',
    lineHeight: 'normal',
    enableShortcuts: true,
    autoLinks: true,
    smartTypography: true,
    placeholder: 'Start typing...',
  },
  todo: {
    strikeCompleted: true,
    hideCompleted: false,
    autoSort: false,
    showProgress: 'counter',
    enableReorder: true,
  },
}

// ============================================
// STATE
// ============================================

const settings = ref<WidgetSettings>(loadSettings())

function loadSettings(): WidgetSettings {
  try {
    const saved = localStorage.getItem('boardkit:widget-settings')
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.warn('Failed to load widget settings:', e)
  }
  return { ...defaultSettings }
}

function saveSettings() {
  try {
    localStorage.setItem('boardkit:widget-settings', JSON.stringify(settings.value))
  } catch (e) {
    console.warn('Failed to save widget settings:', e)
  }
}

// Auto-save on changes
watch(settings, saveSettings, { deep: true })

// ============================================
// COMPOSABLE
// ============================================

export function useWidgetSettings() {
  const boardStore = useBoardStore()

  const visibility = computed(() => settings.value.visibility)
  const textSettings = computed(() => settings.value.text)
  const todoSettings = computed(() => settings.value.todo)

  // Get settings for a specific widget (future: per-widget overrides)
  const getWidgetSettings = (widgetId: string) => {
    const widget = boardStore.widgets.find(w => w.id === widgetId)
    if (!widget) return null

    if (widget.moduleId === 'text') {
      return { ...settings.value.text }
    } else if (widget.moduleId === 'todo') {
      return { ...settings.value.todo }
    }
    return null
  }

  // Update visibility settings
  const updateVisibility = (updates: Partial<WidgetVisibilitySettings>) => {
    settings.value.visibility = { ...settings.value.visibility, ...updates }
  }

  // Update text module settings
  const updateTextSettings = (updates: Partial<TextModuleSettings>) => {
    settings.value.text = { ...settings.value.text, ...updates }
  }

  // Update todo module settings
  const updateTodoSettings = (updates: Partial<TodoModuleSettings>) => {
    settings.value.todo = { ...settings.value.todo, ...updates }
  }

  // Reset to defaults
  const resetToDefaults = () => {
    settings.value = { ...defaultSettings }
  }

  return {
    settings,
    visibility,
    textSettings,
    todoSettings,
    getWidgetSettings,
    updateVisibility,
    updateTextSettings,
    updateTodoSettings,
    resetToDefaults,
  }
}
