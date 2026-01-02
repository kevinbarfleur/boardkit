<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useCommandState } from '../../composables/useCommandState'
import BkIcon from '../BkIcon.vue'

interface Props {
  placeholder?: string
  listboxId?: string
  activeDescendant?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search commands...',
})

const state = useCommandState()
const inputRef = ref<HTMLInputElement | null>(null)

// Auto-focus input when mounted
onMounted(async () => {
  await nextTick()
  inputRef.value?.focus()
})

defineExpose({
  focus: () => inputRef.value?.focus(),
})
</script>

<template>
  <div class="flex items-center gap-2 border-b border-border px-3 h-12">
    <BkIcon
      icon="search"
      :size="16"
      class="shrink-0 text-muted-foreground"
    />
    <input
      ref="inputRef"
      v-model="state.search.value"
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded="true"
      :aria-controls="props.listboxId"
      :aria-activedescendant="props.activeDescendant"
      :placeholder="props.placeholder"
      class="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
    />
    <kbd class="hidden h-5 items-center rounded border border-border bg-background px-1.5 text-[10px] text-muted-foreground sm:inline-flex">
      esc
    </kbd>
  </div>
</template>
