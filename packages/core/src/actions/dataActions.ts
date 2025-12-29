/**
 * Data Sharing Actions
 *
 * Actions for managing inter-module data connections.
 * These actions are available in context menus and the command palette.
 */

import type { ActionDefinition } from '../types/action'
import { consumerRegistry } from '../data/ConsumerRegistry'
import { useBoardStore } from '../stores/boardStore'
import { moduleRegistry } from '../modules/ModuleRegistry'

/**
 * Event bus for data sharing UI events.
 * The UI layer subscribes to these events to show modals and panels.
 */
type DataSharingEvent =
  | { type: 'open-picker'; widgetId: string; contractId: string; multiSelect: boolean }
  | { type: 'open-settings'; widgetId: string; section: 'data-sources' | 'sharing' }
  | { type: 'disconnect-all'; widgetId: string }

type DataSharingEventHandler = (event: DataSharingEvent) => void

class DataSharingEventBus {
  private handlers: Set<DataSharingEventHandler> = new Set()

  subscribe(handler: DataSharingEventHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  emit(event: DataSharingEvent): void {
    for (const handler of this.handlers) {
      handler(event)
    }
  }
}

export const dataSharingEventBus = new DataSharingEventBus()

/**
 * Check if a module is a data provider (has a registered contract).
 */
function isProviderModule(moduleId: string): boolean {
  // For V0, only 'todo' is a provider
  return moduleId === 'todo'
}

/**
 * Check if a widget has any active data connections.
 */
function hasConnections(widgetId: string): boolean {
  const store = useBoardStore()
  const permissions = store.permissions

  // Check if widget is a consumer with connections
  const asConsumer = permissions.filter((p) => p.consumerWidgetId === widgetId)
  if (asConsumer.length > 0) return true

  // Check if widget is a provider being consumed
  const asProvider = permissions.filter((p) => p.providerWidgetId === widgetId)
  if (asProvider.length > 0) return true

  return false
}

/**
 * Create data sharing actions.
 * Must be called after Pinia is initialized.
 */
export function createDataActions(): ActionDefinition[] {
  const store = useBoardStore()

  return [
    // ============================================
    // CONNECT DATA SOURCE
    // ============================================
    {
      id: 'data.connect',
      title: 'Connect Data Source...',
      subtitle: 'Link to another widget\'s data',
      keywords: ['connect', 'link', 'data', 'source', 'sync'],
      icon: 'link',
      group: 'widget',
      contexts: ['widget'],
      priority: 50,
      when: (ctx) => {
        if (!ctx.selectedWidgetId) return false
        const widget = ctx.widgets.find((w) => w.id === ctx.selectedWidgetId)
        if (!widget) return false
        return consumerRegistry.isConsumer(widget.moduleId)
      },
      run: (ctx) => {
        if (!ctx.selectedWidgetId) return

        const widget = ctx.widgets.find((w) => w.id === ctx.selectedWidgetId)
        if (!widget) return

        // Get consumer definition
        const consumers = consumerRegistry.getByModule(widget.moduleId)
        if (consumers.length === 0) return

        // For V0, use the first (and typically only) consumer definition
        const consumerDef = consumers[0]

        dataSharingEventBus.emit({
          type: 'open-picker',
          widgetId: ctx.selectedWidgetId,
          contractId: consumerDef.contractId,
          multiSelect: consumerDef.multiSelect,
        })
      },
    },

    // ============================================
    // DISCONNECT ALL SOURCES
    // ============================================
    {
      id: 'data.disconnect-all',
      title: 'Disconnect All Sources',
      subtitle: 'Remove all data connections',
      keywords: ['disconnect', 'unlink', 'remove', 'data'],
      icon: 'unlink',
      group: 'widget',
      contexts: ['widget'],
      priority: 49,
      when: (ctx) => {
        if (!ctx.selectedWidgetId) return false
        const widget = ctx.widgets.find((w) => w.id === ctx.selectedWidgetId)
        if (!widget) return false
        // Only show for consumers that have connections
        if (!consumerRegistry.isConsumer(widget.moduleId)) return false
        return hasConnections(ctx.selectedWidgetId)
      },
      run: (ctx) => {
        if (!ctx.selectedWidgetId) return

        const widget = ctx.widgets.find((w) => w.id === ctx.selectedWidgetId)
        if (!widget) return

        // Revoke all permissions where this widget is the consumer
        const permissions = store.permissions.filter(
          (p) => p.consumerWidgetId === ctx.selectedWidgetId
        )

        for (const permission of permissions) {
          store.revokeDataPermission(permission.id)
        }

        // Clear the connection state in the widget
        const consumerDefs = consumerRegistry.getByModule(widget.moduleId)
        for (const def of consumerDefs) {
          const moduleState = store.getModuleState(ctx.selectedWidgetId)
          if (moduleState) {
            if (def.multiSelect) {
              store.setModuleState(ctx.selectedWidgetId, {
                ...moduleState,
                [def.stateKey]: [],
              })
            } else {
              store.setModuleState(ctx.selectedWidgetId, {
                ...moduleState,
                [def.stateKey]: null,
              })
            }
          }
        }

        dataSharingEventBus.emit({
          type: 'disconnect-all',
          widgetId: ctx.selectedWidgetId,
        })
      },
    },

    // ============================================
    // VIEW CONNECTIONS (CONSUMER)
    // ============================================
    {
      id: 'data.view-connections',
      title: 'View Connections',
      subtitle: 'See connected data sources',
      keywords: ['view', 'connections', 'data', 'sources', 'linked'],
      icon: 'cable',
      group: 'widget',
      contexts: ['widget'],
      priority: 48,
      when: (ctx) => {
        if (!ctx.selectedWidgetId) return false
        const widget = ctx.widgets.find((w) => w.id === ctx.selectedWidgetId)
        if (!widget) return false
        // Show for consumers
        if (consumerRegistry.isConsumer(widget.moduleId)) return true
        // Show for providers that have consumers
        if (isProviderModule(widget.moduleId)) {
          return hasConnections(ctx.selectedWidgetId)
        }
        return false
      },
      run: (ctx) => {
        if (!ctx.selectedWidgetId) return

        const widget = ctx.widgets.find((w) => w.id === ctx.selectedWidgetId)
        if (!widget) return

        const section = consumerRegistry.isConsumer(widget.moduleId)
          ? 'data-sources'
          : 'sharing'

        dataSharingEventBus.emit({
          type: 'open-settings',
          widgetId: ctx.selectedWidgetId,
          section,
        })
      },
    },
  ]
}
