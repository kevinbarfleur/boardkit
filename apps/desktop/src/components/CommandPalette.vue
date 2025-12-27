<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useBoardStore, moduleRegistry } from '@boardkit/core'
import { BkModal, BkInput, BkIcon } from '@boardkit/ui'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const boardStore = useBoardStore()
const searchQuery = ref('')
const inputRef = ref<InstanceType<typeof BkInput> | null>(null)
const selectedIndex = ref(0)

const availableModules = computed(() => {
  const modules = moduleRegistry.getAll()
  if (!searchQuery.value.trim()) return modules

  const query = searchQuery.value.toLowerCase()
  return modules.filter(
    (m) =>
      m.displayName.toLowerCase().includes(query) ||
      m.moduleId.toLowerCase().includes(query)
  )
})

const handleSelect = (moduleId: string) => {
  boardStore.addWidget(moduleId)
  close()
}

const close = () => {
  searchQuery.value = ''
  selectedIndex.value = 0
  emit('close')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, availableModules.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const selected = availableModules.value[selectedIndex.value]
    if (selected) {
      handleSelect(selected.moduleId)
    }
  }
}

// Focus input when opened
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      selectedIndex.value = 0
      await nextTick()
      // Focus the input inside BkInput
      const inputEl = inputRef.value?.$el?.querySelector('input')
      inputEl?.focus()
    }
  }
)

// Reset selection when search changes
watch(searchQuery, () => {
  selectedIndex.value = 0
})
</script>

<template>
  <BkModal :open="props.open" title="Add Widget" @close="close">
    <div class="flex flex-col gap-4" @keydown="handleKeydown">
      <BkInput
        ref="inputRef"
        v-model="searchQuery"
        placeholder="Search widgets..."
      />

      <div class="flex flex-col gap-1 max-h-64 overflow-auto">
        <button
          v-for="(module, index) in availableModules"
          :key="module.moduleId"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors"
          :class="[
            index === selectedIndex
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent'
          ]"
          @click="handleSelect(module.moduleId)"
          @mouseenter="selectedIndex = index"
        >
          <BkIcon icon="plus" size="sm" />
          <span class="font-medium">{{ module.displayName }}</span>
        </button>

        <p
          v-if="availableModules.length === 0"
          class="text-sm text-muted-foreground text-center py-4"
        >
          No widgets found
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center gap-4 text-xs text-muted-foreground">
        <span class="flex items-center gap-1">
          <kbd class="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Enter</kbd>
          to select
        </span>
        <span class="flex items-center gap-1">
          <kbd class="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Esc</kbd>
          to close
        </span>
      </div>
    </template>
  </BkModal>
</template>
