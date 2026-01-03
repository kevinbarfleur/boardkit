---
globs: ["**/*.vue", "packages/ui/**", "apps/web/src/components/**"]
---

# Vue 3 Patterns

## Component Structure

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'
import { BkButton } from '@boardkit/ui'

// 2. Props & Emits
const props = defineProps<{
  title: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  update: [value: string]
  close: []
}>()

// 3. Composables
const { state } = useSomething()

// 4. Reactive state
const isOpen = ref(false)

// 5. Computed
const displayTitle = computed(() => props.title.toUpperCase())

// 6. Methods
function handleClick() {
  emit('close')
}

// 7. Lifecycle (if needed)
onMounted(() => { /* ... */ })
</script>

<template>
  <!-- Single root element preferred -->
</template>
```

## Composables

### Naming
- File: `use{Name}.ts`
- Export: `function use{Name}()`

### Pattern
```typescript
export function useFeature(options?: FeatureOptions) {
  // Reactive state
  const state = ref<State>(initialState)

  // Computed
  const derived = computed(() => /* ... */)

  // Methods
  function doSomething() { /* ... */ }

  // Cleanup if needed
  onUnmounted(() => { /* ... */ })

  // Return reactive refs + methods
  return {
    state: readonly(state),
    derived,
    doSomething
  }
}
```

## Props

### Prefer
```typescript
// Typed props with defaults
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md'
})
```

### Avoid
```typescript
// Runtime validation (less type-safe)
defineProps({
  size: {
    type: String,
    default: 'md'
  }
})
```

## Events

### Naming
- Use present tense verbs: `update`, `select`, `close`
- Not past tense: ~~`updated`~~, ~~`selected`~~

### Pattern
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [item: Item]
  close: []
}>()
```

## Slots

```vue
<!-- Named slots with fallback -->
<slot name="header">
  <DefaultHeader />
</slot>

<!-- Scoped slots -->
<slot name="item" :item="item" :index="index" />
```

## Performance

1. Use `v-once` for static content
2. Use `v-memo` for expensive lists
3. Lazy load heavy components: `defineAsyncComponent`
4. Use `shallowRef` when deep reactivity not needed
