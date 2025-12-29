import { ref, computed } from 'vue'

interface SettingsPanelState {
  open: boolean
  widgetId: string | null
}

const state = ref<SettingsPanelState>({
  open: false,
  widgetId: null,
})

export function useSettingsPanel() {
  const isOpen = computed(() => state.value.open)
  const widgetId = computed(() => state.value.widgetId)

  const openForWidget = (id: string) => {
    state.value = { open: true, widgetId: id }
  }

  const close = () => {
    state.value = { open: false, widgetId: null }
  }

  return {
    isOpen,
    widgetId,
    openForWidget,
    close,
  }
}
