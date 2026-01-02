import { actionRegistry, type ActionDefinition } from '@boardkit/core'
import { useSettingsPanel } from '../composables/useSettingsPanel'
import router from '../router'

/**
 * Web-specific actions for Boardkit.
 * These are actions that are specific to the web application.
 */
export function registerWebActions(): void {
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
    {
      id: 'view.switch-to-library',
      title: 'Go to Library',
      subtitle: 'Browse modules by type',
      keywords: ['library', 'browse', 'modules', 'view', 'list'],
      icon: 'library',
      group: 'view',
      contexts: ['global', 'canvas'],
      shortcutHint: '⌘⇧L',
      priority: 40,
      run: () => {
        router.push('/library')
      },
    },
    {
      id: 'view.switch-to-canvas',
      title: 'Go to Canvas',
      subtitle: 'Return to the board view',
      keywords: ['canvas', 'board', 'view', 'spatial'],
      icon: 'layout-dashboard',
      group: 'view',
      contexts: ['global'],
      shortcutHint: '⌘⇧L',
      priority: 40,
      run: () => {
        router.push('/')
      },
    },
  ]

  actionRegistry.registerAll(actions)
}
