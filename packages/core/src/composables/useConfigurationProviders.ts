/**
 * useConfigurationProviders
 *
 * Composable that provides reactive lists of data providers
 * in the format expected by BkConfigurationPanel.
 */
import { useBoardStore } from '../stores/boardStore'
import { dataBus } from '../data/DataBus'
import { moduleRegistry } from '../modules/ModuleRegistry'

/**
 * Provider info needed for configuration panels.
 * This matches the ConfigPanelProvider interface from @boardkit/ui.
 */
export interface ConfigurationProvider {
  id: string
  moduleId: string
  contractId: string
  title: string
  icon?: string
  meta?: string
}

/**
 * Module icon mapping for common modules
 */
const MODULE_ICONS: Record<string, string> = {
  todo: 'list-todo',
  counter: 'hash',
  timer: 'timer',
  kanban: 'columns',
  'habit-tracker': 'calendar-check',
  text: 'file-text',
  scratchpad: 'sticky-note',
}

/**
 * Get icon for a module ID
 */
function getModuleIcon(moduleId: string): string {
  // First check module definition
  const moduleDef = moduleRegistry.get(moduleId)
  if (moduleDef?.icon) {
    return moduleDef.icon
  }
  // Fallback to hardcoded mapping
  return MODULE_ICONS[moduleId] || 'box'
}

/**
 * Build metadata string based on contract type and data
 */
function buildMetadataString(
  contractId: string,
  data: unknown
): string {
  if (!data || typeof data !== 'object') return ''

  const typedData = data as Record<string, unknown>

  // Handle todo contract
  if (contractId === 'boardkit.todo.v1') {
    const progress = typedData.progress as { done?: number; total?: number } | undefined
    if (progress?.total !== undefined) {
      return `${progress.done ?? 0}/${progress.total} tasks`
    }
  }

  // Handle counter contract
  if (contractId === 'boardkit.counter.v1') {
    const value = typedData.value as number | undefined
    if (value !== undefined) {
      return `${value}`
    }
  }

  // Handle habits stats contract
  if (contractId === 'boardkit.habits-stats.v1') {
    const streak = typedData.currentStreak as number | undefined
    if (streak !== undefined) {
      return `${streak} day streak`
    }
  }

  // Handle kanban stats contract
  if (contractId === 'boardkit.kanban-stats.v1') {
    const total = typedData.totalItems as number | undefined
    if (total !== undefined) {
      return `${total} items`
    }
  }

  // Handle timer history contract
  if (contractId === 'boardkit.timer-history.v1') {
    const sessions = typedData.sessionCount as number | undefined
    if (sessions !== undefined) {
      return `${sessions} sessions`
    }
  }

  return ''
}

export function useConfigurationProviders() {
  const boardStore = useBoardStore()

  /**
   * Get all providers for a specific contract ID,
   * enriched with title, icon, and metadata.
   */
  function getProvidersForContract(contractId: string): ConfigurationProvider[] {
    const baseProviders = boardStore.getAvailableProviders(contractId)

    return baseProviders.map((provider) => {
      const widget = boardStore.widgets.find((w) => w.id === provider.id)
      const moduleState = boardStore.getModuleState(provider.id) as Record<string, unknown> | null
      const moduleDef = moduleRegistry.get(provider.moduleId)

      // Get cached data from the data bus
      const cachedData = dataBus.getData(provider.id, contractId)

      // Determine title: prefer data title, then module state title, then module name
      let title = 'Unknown'
      if (cachedData && typeof cachedData === 'object') {
        const dataTitle = (cachedData as Record<string, unknown>).title as string | undefined
        if (dataTitle) title = dataTitle
      }
      if (title === 'Unknown' && moduleState?.title) {
        title = moduleState.title as string
      }
      if (title === 'Unknown' && moduleDef?.displayName) {
        title = moduleDef.displayName
      }

      // Build metadata string
      const meta = buildMetadataString(contractId, cachedData)

      return {
        id: provider.id,
        moduleId: provider.moduleId,
        contractId,
        title,
        icon: getModuleIcon(provider.moduleId),
        meta,
      }
    })
  }

  /**
   * Get all providers across multiple contract IDs.
   */
  function getAllProviders(contractIds: string[]): ConfigurationProvider[] {
    return contractIds.flatMap((contractId) => getProvidersForContract(contractId))
  }

  /**
   * Get unique contract IDs from a configuration schema.
   */
  function extractContractIdsFromSchema(
    sections: Array<{ type: string; contractId?: string; contracts?: Array<{ contractId: string }> }>
  ): string[] {
    const contractIds = new Set<string>()

    for (const section of sections) {
      if (section.type === 'source-picker' && section.contractId) {
        contractIds.add(section.contractId)
      } else if (section.type === 'source-picker-group' && section.contracts) {
        for (const contract of section.contracts) {
          contractIds.add(contract.contractId)
        }
      }
    }

    return Array.from(contractIds)
  }

  return {
    getProvidersForContract,
    getAllProviders,
    extractContractIdsFromSchema,
  }
}
