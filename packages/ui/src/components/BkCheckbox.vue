<script setup lang="ts">
import BkIcon from './BkIcon.vue'

interface Props {
  modelValue?: boolean
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<template>
  <div class="flex items-center">
    <button
      type="button"
      role="checkbox"
      :id="props.id"
      :aria-checked="props.modelValue"
      :disabled="props.disabled"
      class="h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      :class="[
        props.modelValue
          ? 'bg-primary border-primary text-primary-foreground'
          : 'bg-background border-border'
      ]"
      @click="toggle"
      @keydown.space.prevent="toggle"
      @keydown.enter.prevent="toggle"
    >
      <BkIcon
        v-if="props.modelValue"
        icon="check"
        :size="12"
        class="text-primary-foreground"
      />
    </button>
    <label
      v-if="$slots.default"
      :for="props.id"
      class="ml-2 text-sm font-medium leading-none cursor-pointer"
      :class="props.disabled ? 'cursor-not-allowed opacity-70' : ''"
      @click="toggle"
    >
      <slot />
    </label>
  </div>
</template>
