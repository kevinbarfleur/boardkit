<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  delay: 300,
})

const isVisible = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

const show = () => {
  timeout = setTimeout(() => {
    isVisible.value = true
  }, props.delay)
}

const hide = () => {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  isVisible.value = false
}

const positionClasses: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowClasses: Record<string, string> = {
  top: 'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary',
  bottom: 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-primary',
  left: 'absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-primary',
  right: 'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-primary',
}
</script>

<template>
  <div
    class="relative inline-block"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
  >
    <slot />

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isVisible"
        class="absolute z-50 px-3 py-1.5 text-xs text-primary-foreground bg-primary rounded-md whitespace-nowrap"
        :class="positionClasses[props.position]"
      >
        {{ props.content }}
        <div :class="arrowClasses[props.position]" />
      </div>
    </Transition>
  </div>
</template>
