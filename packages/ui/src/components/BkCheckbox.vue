<script setup lang="ts">
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
      class="bk-checkbox-btn h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:border-border-strong disabled:cursor-not-allowed disabled:opacity-50"
      :class="[
        props.modelValue
          ? 'bg-primary border-primary'
          : 'bg-background border-border'
      ]"
      @click="toggle"
      @keydown.space.prevent="toggle"
      @keydown.enter.prevent="toggle"
    >
      <svg
        v-if="props.modelValue"
        class="bk-check-icon"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
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

<style>
/*
 * Checkmark colors are hardcoded instead of using UnoCSS classes (e.g. text-primary-foreground)
 * because UnoCSS generates colors in the format `hsl(var(--x) / <alpha-value>)` which doesn't
 * reliably cascade to SVG stroke via CSS inheritance or currentColor.
 *
 * Additionally, passing colors via Vue reactive bindings (:stroke="color") doesn't work
 * consistently, while hardcoded inline styles do.
 *
 * These values match --primary-foreground from globals.css:
 * - Dark mode: #fafafa (light check on light bg-primary)
 * - Light mode: #171717 (dark check on dark bg-primary)
 */
.bk-check-icon {
  stroke: #fafafa;
}

.light .bk-check-icon {
  stroke: #171717;
}
</style>
