<script setup lang="ts">
import { RouterView } from 'vue-router'
import { BkModalProvider, BkToastProvider } from '@boardkit/ui'
</script>

<template>
  <BkToastProvider>
    <BkModalProvider>
      <RouterView />
    </BkModalProvider>
  </BkToastProvider>
</template>
