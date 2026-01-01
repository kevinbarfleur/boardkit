<script setup lang="ts">
const props = defineProps<{
  code: string
  lang?: string
  filename?: string
}>()

const { highlighted, isLoading, highlight } = useShiki()

// Highlight on mount and when code changes
watch(
  () => props.code,
  (code) => highlight(code, props.lang || 'typescript'),
  { immediate: true }
)
</script>

<template>
  <div class="code-block-wrapper">
    <!-- Optional filename header -->
    <div
      v-if="filename"
      class="code-block-header"
    >
      <span class="i-lucide-file-text text-muted-foreground text-sm" />
      <span class="text-sm text-muted-foreground font-mono">{{ filename }}</span>
    </div>

    <!-- Code block -->
    <div
      class="code-block"
      :class="{ 'rounded-t-none': filename }"
    >
      <div
        v-if="isLoading"
        class="code-loading"
      >
        <span class="text-muted-foreground text-sm">Loading...</span>
      </div>
      <div
        v-else
        class="code-content"
        v-html="highlighted"
      />
    </div>
  </div>
</template>

<style scoped>
.code-block-wrapper {
  @apply relative;
}

.code-block-header {
  @apply flex items-center gap-2 px-4 py-2;
  @apply bg-[#161b22] border border-b-0 border-white/10;
  @apply rounded-t-xl;
}

.code-block {
  @apply rounded-xl bg-[#0d1117] p-4;
  @apply border border-white/10;
  @apply overflow-x-auto;
  @apply text-sm font-mono;
}

.code-loading {
  @apply flex items-center justify-center py-8;
}

.code-content :deep(pre) {
  @apply m-0 p-0 bg-transparent;
}

.code-content :deep(code) {
  @apply bg-transparent;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}

.code-content :deep(.line) {
  @apply leading-relaxed;
}
</style>
