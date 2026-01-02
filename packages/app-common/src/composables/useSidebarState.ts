import { useStorage } from '@vueuse/core'

const SIDEBAR_COLLAPSED_KEY = 'boardkit-sidebar-collapsed'

// Persistent sidebar state with VueUse
const sidebarCollapsed = useStorage<boolean>(SIDEBAR_COLLAPSED_KEY, false)

export function useSidebarState() {
  const toggleSidebarCollapse = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
  }

  return {
    sidebarCollapsed,
    toggleSidebarCollapse,
    setSidebarCollapsed,
  }
}
