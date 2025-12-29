/**
 * useDataSharingUI
 *
 * Composable for managing data sharing UI state.
 * Handles the data source picker modal and settings panel integration.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  useBoardStore,
  dataSharingEventBus,
  dataBus,
  consumerRegistry,
  moduleRegistry,
} from '@boardkit/core'
import type { ProviderInfo } from '@boardkit/ui'
import { useSettingsPanel } from './useSettingsPanel'

// ============================================================================
// Picker Modal State
// ============================================================================

interface PickerConfig {
  consumerWidgetId: string
  contractId: string
  multiSelect: boolean
}

const pickerOpen = ref(false)
const pickerConfig = ref<PickerConfig | null>(null)

// ============================================================================
// Provider Data Helpers
// ============================================================================

/**
 * Get provider info for display in the picker.
 */
function getProviderInfo(
  widgetId: string,
  moduleId: string,
  contractId: string
): ProviderInfo {
  const store = useBoardStore()
  const module = moduleRegistry.get(moduleId)
  const moduleState = store.getModuleState(widgetId) as Record<string, unknown> | null

  // Get title from module state or fall back to module displayName
  let title = module?.displayName || moduleId
  if (moduleState && typeof moduleState.title === 'string') {
    title = moduleState.title
  }

  // Get preview data from the data bus cache
  const cachedData = dataBus.getData(widgetId, contractId) as {
    progress?: { done: number; total: number }
    items?: unknown[]
  } | null

  let preview: ProviderInfo['preview'] | undefined

  if (cachedData) {
    if (cachedData.progress) {
      const { done, total } = cachedData.progress
      preview = {
        itemCount: `${total} task${total !== 1 ? 's' : ''}`,
        progress: `${done}/${total} completed`,
      }
    } else if (cachedData.items) {
      const count = cachedData.items.length
      preview = {
        itemCount: `${count} item${count !== 1 ? 's' : ''}`,
      }
    }
  }

  // Get icon based on module
  let icon = 'box'
  if (moduleId === 'todo') {
    icon = 'list-todo'
  }

  return {
    id: widgetId,
    moduleId,
    title,
    icon,
    preview,
  }
}

// ============================================================================
// Composable
// ============================================================================

export function useDataSharingUI() {
  const store = useBoardStore()
  const settingsPanel = useSettingsPanel()
  let unsubscribeEventBus: (() => void) | null = null

  // Setup event bus subscription
  onMounted(() => {
    unsubscribeEventBus = dataSharingEventBus.subscribe((event) => {
      switch (event.type) {
        case 'open-picker':
          pickerConfig.value = {
            consumerWidgetId: event.widgetId,
            contractId: event.contractId,
            multiSelect: event.multiSelect,
          }
          pickerOpen.value = true
          break

        case 'open-settings':
          // Open settings panel for the widget
          settingsPanel.openForWidget(event.widgetId)
          // TODO: Scroll to data sources section
          break

        case 'disconnect-all':
          // This is just a notification, no action needed
          break
      }
    })
  })

  onUnmounted(() => {
    if (unsubscribeEventBus) {
      unsubscribeEventBus()
      unsubscribeEventBus = null
    }
  })

  // Get available providers for the current picker config
  const availableProviders = computed<ProviderInfo[]>(() => {
    if (!pickerConfig.value) return []

    const { contractId } = pickerConfig.value
    const providers = store.getAvailableProviders(contractId)

    return providers.map((p) => getProviderInfo(p.id, p.moduleId, contractId))
  })

  // Get current connections for the consumer widget
  const currentConnections = computed<string[]>(() => {
    if (!pickerConfig.value) return []

    const { consumerWidgetId, contractId } = pickerConfig.value

    // Get connected provider IDs from permissions
    return store.permissions
      .filter(
        (p) =>
          p.consumerWidgetId === consumerWidgetId && p.contractId === contractId
      )
      .map((p) => p.providerWidgetId)
  })

  // Open the picker manually
  function openPicker(config: PickerConfig) {
    pickerConfig.value = config
    pickerOpen.value = true
  }

  // Close the picker
  function closePicker() {
    pickerOpen.value = false
    pickerConfig.value = null
  }

  // Handle connection updates from the picker
  function handleConnectionsUpdate(providerIds: string[]) {
    if (!pickerConfig.value) return

    const { consumerWidgetId, contractId, multiSelect } = pickerConfig.value

    // Get consumer definition to know the state key
    const widget = store.widgets.find((w) => w.id === consumerWidgetId)
    if (!widget) return

    const consumerDef = consumerRegistry.getByModule(widget.moduleId).find(
      (c) => c.contractId === contractId
    )
    if (!consumerDef) return

    // Get current connections
    const currentProviderIds = currentConnections.value
    const newProviderIds = new Set(providerIds)
    const oldProviderIds = new Set(currentProviderIds)

    // Revoke permissions for removed connections
    for (const providerId of oldProviderIds) {
      if (!newProviderIds.has(providerId)) {
        store.revokeDataPermissionByLink(consumerWidgetId, providerId, contractId)
      }
    }

    // Grant permissions for new connections
    for (const providerId of newProviderIds) {
      if (!oldProviderIds.has(providerId)) {
        store.grantDataPermission(consumerWidgetId, providerId, contractId)
      }
    }

    // Update the module state
    const moduleState = store.getModuleState(consumerWidgetId) as Record<string, unknown> | null
    if (moduleState) {
      if (multiSelect) {
        store.setModuleState(consumerWidgetId, {
          ...moduleState,
          [consumerDef.stateKey]: providerIds,
        })
      } else {
        store.setModuleState(consumerWidgetId, {
          ...moduleState,
          [consumerDef.stateKey]: providerIds[0] || null,
        })
      }
    }

    closePicker()
  }

  return {
    // Picker state
    pickerOpen: computed(() => pickerOpen.value),
    pickerConfig: computed(() => pickerConfig.value),
    availableProviders,
    currentConnections,

    // Picker actions
    openPicker,
    closePicker,
    handleConnectionsUpdate,
  }
}
