import { actionRegistry, type ActionDefinition } from '@boardkit/core'
import { useSettingsPanel } from '../composables/useSettingsPanel'

/**
 * Desktop-specific actions for Boardkit.
 * These are actions that are specific to the desktop application.
 */
export function registerDesktopActions(): void {
  const { openForWidget } = useSettingsPanel()

  const actions: ActionDefinition[] = [
    {
      id: 'settings.open',
      title: 'Settings',
      subtitle: 'Open widget settings',
      keywords: ['settings', 'preferences', 'options', 'configure'],
      icon: 'settings',
      group: 'widget',
      contexts: ['widget'],
      priority: 50,
      run: (ctx) => {
        if (ctx.selectedWidgetId) {
          openForWidget(ctx.selectedWidgetId)
        }
      },
    },
  ]

  actionRegistry.registerAll(actions)
}
