<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Click to edit',
  disabled: false,
  size: 'md',
  maxWidth: '200px',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isEditing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const editValue = ref('')

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs'
    case 'lg':
      return 'text-base'
    default:
      return 'text-sm'
  }
})

const startEditing = () => {
  if (props.disabled) return
  editValue.value = props.modelValue
  isEditing.value = true
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

const finishEditing = () => {
  if (!isEditing.value) return
  isEditing.value = false
  const trimmed = editValue.value.trim()
  if (trimmed && trimmed !== props.modelValue) {
    emit('update:modelValue', trimmed)
  }
}

const cancelEditing = () => {
  isEditing.value = false
  editValue.value = props.modelValue
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    finishEditing()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancelEditing()
  }
}
</script>

<template>
  <div
    class="inline-flex items-center"
    :style="{ maxWidth: props.maxWidth }"
  >
    <!-- Edit mode -->
    <input
      v-if="isEditing"
      ref="inputRef"
      v-model="editValue"
      type="text"
      class="font-medium bg-transparent border-b border-primary outline-none w-full px-1 py-0.5 -mx-1 text-foreground leading-normal"
      :class="sizeClasses"
      @blur="finishEditing"
      @keydown="onKeydown"
    />

    <!-- Display mode -->
    <span
      v-else
      class="font-medium truncate cursor-text rounded px-1 py-0.5 -mx-1 transition-colors hover:bg-accent leading-normal"
      :class="[
        sizeClasses,
        props.disabled ? 'cursor-default opacity-50' : '',
        props.modelValue ? 'text-foreground' : 'text-muted-foreground italic',
      ]"
      @dblclick="startEditing"
    >
      {{ props.modelValue || props.placeholder }}
    </span>
  </div>
</template>
