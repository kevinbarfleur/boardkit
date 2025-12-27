<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface DropdownItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  separator?: boolean
}

interface Props {
  items: DropdownItem[]
  align?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  align: 'left',
})

const emit = defineEmits<{
  select: [item: DropdownItem]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const selectItem = (item: DropdownItem) => {
  if (item.disabled || item.separator) return
  emit('select', item)
  close()
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block">
    <div @click="toggle">
      <slot name="trigger" />
    </div>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-2 w-full min-w-[140px] rounded-lg border border-border bg-popover p-1 shadow-lg"
        :class="props.align === 'right' ? 'right-0' : 'left-0'"
      >
        <template v-for="item in props.items" :key="item.id">
          <div
            v-if="item.separator"
            class="my-1 h-px bg-border"
          />
          <button
            v-else
            class="relative flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent"
            :class="{ 'opacity-50 cursor-not-allowed': item.disabled }"
            :disabled="item.disabled"
            @click="selectItem(item)"
          >
            {{ item.label }}
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>
