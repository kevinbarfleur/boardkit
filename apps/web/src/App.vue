<script setup lang="ts">
import { RouterView } from 'vue-router'
import { BkModalProvider } from '@boardkit/ui'
</script>

<template>
  <BkModalProvider>
    <RouterView />
  </BkModalProvider>
</template>
