import { ref, computed } from 'vue'

type SettingsMode = 'widget' | 'app'

interface SettingsPanelState {
  open: boolean
  mode: SettingsMode
  widgetId: string | null
}

const state = ref<SettingsPanelState>({
  open: false,
  mode: 'widget',
  widgetId: null,
})

export function useSettingsPanel() {
  const isOpen = computed(() => state.value.open)
  const mode = computed(() => state.value.mode)
  const widgetId = computed(() => state.value.widgetId)
  const isAppSettings = computed(() => state.value.mode === 'app')

  const openForWidget = (id: string) => {
    state.value = { open: true, mode: 'widget', widgetId: id }
  }

  const openAppSettings = () => {
    state.value = { open: true, mode: 'app', widgetId: null }
  }

  const close = () => {
    state.value = { open: false, mode: 'widget', widgetId: null }
  }

  return {
    isOpen,
    mode,
    widgetId,
    isAppSettings,
    openForWidget,
    openAppSettings,
    close,
  }
}
