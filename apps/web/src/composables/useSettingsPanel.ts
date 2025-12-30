import { ref, computed } from 'vue'

interface SettingsPanelState {
  open: boolean
  widgetId: string | null
  initialTab: string | null
}

interface OpenOptions {
  tab?: string
}

const state = ref<SettingsPanelState>({
  open: false,
  widgetId: null,
  initialTab: null,
})

export function useSettingsPanel() {
  const isOpen = computed(() => state.value.open)
  const widgetId = computed(() => state.value.widgetId)
  const initialTab = computed(() => state.value.initialTab)

  const openForWidget = (id: string, options?: OpenOptions) => {
    state.value = {
      open: true,
      widgetId: id,
      initialTab: options?.tab ?? null,
    }
  }

  const close = () => {
    state.value = { open: false, widgetId: null, initialTab: null }
  }

  return {
    isOpen,
    widgetId,
    initialTab,
    openForWidget,
    close,
  }
}
