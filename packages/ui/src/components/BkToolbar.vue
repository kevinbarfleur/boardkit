<script setup lang="ts">
/**
 * BkToolbar
 *
 * A floating toolbar container for canvas tools.
 * Positioned at the bottom-center of the viewport by default.
 */

interface Props {
  /** Position of the toolbar */
  position?: 'bottom-center' | 'left' | 'top-center'
}

withDefaults(defineProps<Props>(), {
  position: 'bottom-center',
})
</script>

<template>
  <div
    class="bk-toolbar"
    :class="{
      'bottom-center': position === 'bottom-center',
      'left-side': position === 'left',
      'top-center': position === 'top-center',
    }"
  >
    <div class="toolbar-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.bk-toolbar {
  position: fixed;
  z-index: 100;
  pointer-events: auto;
}

.bk-toolbar.bottom-center {
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}

.bk-toolbar.left-side {
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.bk-toolbar.top-center {
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
}

.toolbar-content {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background-color: hsl(var(--popover));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.bk-toolbar.left-side .toolbar-content {
  flex-direction: column;
}
</style>
