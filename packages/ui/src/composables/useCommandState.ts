import { ref, computed, provide, inject, type Ref, type InjectionKey } from 'vue'

export interface CommandState {
  // Search
  search: Ref<string>

  // Selection
  selectedValue: Ref<string>
  selectedIndex: Ref<number>

  // Items registry
  items: Ref<CommandItemData[]>

  // Config
  loop: Ref<boolean>

  // Computed
  filteredItems: Ref<CommandItemData[]>
  selectedItem: Ref<CommandItemData | undefined>

  // Actions
  registerItem: (item: CommandItemData) => void
  unregisterItem: (id: string) => void
  selectItem: (value: string) => void
  selectIndex: (index: number) => void
  next: () => void
  prev: () => void
  first: () => void
  last: () => void

  // List ref for scroll management
  listRef: Ref<HTMLElement | null>
}

export interface CommandItemData {
  id: string
  value: string
  disabled: boolean
  keywords?: string[]
  group?: string
}

const COMMAND_STATE_KEY: InjectionKey<CommandState> = Symbol('command-state')

export function createCommandState(options: { loop?: boolean } = {}) {
  const search = ref('')
  const selectedValue = ref('')
  const selectedIndex = ref(0)
  const items = ref<CommandItemData[]>([])
  const loop = ref(options.loop ?? true)
  const listRef = ref<HTMLElement | null>(null)

  // Filter items based on search
  const filteredItems = computed(() => {
    const query = search.value.toLowerCase().trim()
    if (!query) return items.value.filter(item => !item.disabled)

    return items.value.filter(item => {
      if (item.disabled) return false

      const valueMatch = item.value.toLowerCase().includes(query)
      const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(query))

      return valueMatch || keywordMatch
    })
  })

  // Get currently selected item
  const selectedItem = computed(() => {
    return filteredItems.value[selectedIndex.value]
  })

  // Keep selected index in bounds when items change
  const clampIndex = (index: number): number => {
    const max = filteredItems.value.length - 1
    if (max < 0) return 0
    if (index < 0) return loop.value ? max : 0
    if (index > max) return loop.value ? 0 : max
    return index
  }

  // Register an item
  const registerItem = (item: CommandItemData) => {
    const existingIndex = items.value.findIndex(i => i.id === item.id)
    if (existingIndex >= 0) {
      items.value[existingIndex] = item
    } else {
      items.value.push(item)
    }
  }

  // Unregister an item
  const unregisterItem = (id: string) => {
    const index = items.value.findIndex(i => i.id === id)
    if (index >= 0) {
      items.value.splice(index, 1)
    }
  }

  // Select by value
  const selectItem = (value: string) => {
    const index = filteredItems.value.findIndex(item => item.value === value)
    if (index >= 0) {
      selectedIndex.value = index
      selectedValue.value = value
    }
  }

  // Select by index
  const selectIndex = (index: number) => {
    const clampedIndex = clampIndex(index)
    selectedIndex.value = clampedIndex
    const item = filteredItems.value[clampedIndex]
    if (item) {
      selectedValue.value = item.value
    }
  }

  // Navigate to next item
  const next = () => {
    selectIndex(selectedIndex.value + 1)
  }

  // Navigate to previous item
  const prev = () => {
    selectIndex(selectedIndex.value - 1)
  }

  // Navigate to first item
  const first = () => {
    selectIndex(0)
  }

  // Navigate to last item
  const last = () => {
    selectIndex(filteredItems.value.length - 1)
  }

  const state: CommandState = {
    search,
    selectedValue,
    selectedIndex,
    items,
    loop,
    filteredItems,
    selectedItem,
    registerItem,
    unregisterItem,
    selectItem,
    selectIndex,
    next,
    prev,
    first,
    last,
    listRef,
  }

  return state
}

export function provideCommandState(state: CommandState) {
  provide(COMMAND_STATE_KEY, state)
}

export function useCommandState(): CommandState {
  const state = inject(COMMAND_STATE_KEY)
  if (!state) {
    throw new Error('useCommandState must be used within a Command component')
  }
  return state
}

// Generate unique ID for items
let itemIdCounter = 0
export function generateItemId(): string {
  return `cmd-item-${++itemIdCounter}`
}
