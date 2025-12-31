<script setup lang="ts">
import { BkIcon, BkButton } from '@boardkit/ui'

const emit = defineEmits<{
  configure: []
}>()
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center gap-3 p-4">
    <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
      <BkIcon icon="calendar" :size="24" class="text-muted-foreground" />
    </div>
    <div class="text-center">
      <p class="text-sm font-medium text-foreground">Connect Google Calendar</p>
      <p class="text-xs text-muted-foreground mt-1">
        View your upcoming events at a glance
      </p>
    </div>
    <BkButton size="sm" @click="emit('configure')">
      <BkIcon icon="settings" :size="14" class="mr-1.5" />
      Configure
    </BkButton>
  </div>
</template>
