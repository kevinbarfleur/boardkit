import { ref, computed } from 'vue'

type SettingsMode = 'widget' | 'app'

interface SettingsPanelState {
  open: boolean
  mode: SettingsMode
  widgetId: string | null
  initialTab: string | null
}

interface OpenOptions {
  tab?: string
}

const state = ref<SettingsPanelState>({
  open: false,
  mode: 'widget',
  widgetId: null,
  initialTab: null,
})

export function useSettingsPanel() {
  const isOpen = computed(() => state.value.open)
  const mode = computed(() => state.value.mode)
  const widgetId = computed(() => state.value.widgetId)
  const initialTab = computed(() => state.value.initialTab)
  const isAppSettings = computed(() => state.value.mode === 'app')

  const openForWidget = (id: string, options?: OpenOptions) => {
    state.value = {
      open: true,
      mode: 'widget',
      widgetId: id,
      initialTab: options?.tab ?? null,
    }
  }

  const openAppSettings = (tab?: string) => {
    state.value = { open: true, mode: 'app', widgetId: null, initialTab: tab ?? null }
  }

  const close = () => {
    state.value = { open: false, mode: 'widget', widgetId: null, initialTab: null }
  }

  return {
    isOpen,
    mode,
    widgetId,
    initialTab,
    isAppSettings,
    openForWidget,
    openAppSettings,
    close,
  }
}
