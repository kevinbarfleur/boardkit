<script setup lang="ts">
import { ref } from 'vue'
import { BkModal, BkButton, BkIcon } from '@boardkit/ui'
import { useVault } from '../composables/useVault'

const emit = defineEmits<{
  setup: [vaultPath: string]
}>()

const vault = useVault()
const isLoading = ref(false)
const error = ref<string | null>(null)

const handleSelectFolder = async () => {
  isLoading.value = true
  error.value = null

  try {
    const path = await vault.selectVaultFolder()
    if (path) {
      emit('setup', path)
    }
  } catch (e) {
    error.value = 'Failed to select folder. Please try again.'
    console.error('Vault selection error:', e)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <BkModal :open="true" title="Welcome to Boardkit" @submit="handleSelectFolder">
    <div class="space-y-6">
      <!-- Welcome message -->
      <div class="text-center space-y-2">
        <div class="flex justify-center">
          <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BkIcon icon="folder-open" class="w-8 h-8 text-primary" />
          </div>
        </div>
        <p class="text-muted-foreground">
          To get started, select a folder where your boards will be saved.
          This folder will be your vault - all your <code class="text-foreground">.boardkit</code> files will be stored here.
        </p>
      </div>

      <!-- Benefits -->
      <div class="space-y-3 text-sm">
        <div class="flex items-start gap-3">
          <div class="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
            <BkIcon icon="check" class="w-3 h-3 text-primary" />
          </div>
          <p class="text-muted-foreground">
            <span class="text-foreground font-medium">Your data, your control</span> - Files are saved locally, sync with your preferred cloud service
          </p>
        </div>
        <div class="flex items-start gap-3">
          <div class="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
            <BkIcon icon="check" class="w-3 h-3 text-primary" />
          </div>
          <p class="text-muted-foreground">
            <span class="text-foreground font-medium">Automatic saving</span> - Your changes are saved continuously as you work
          </p>
        </div>
        <div class="flex items-start gap-3">
          <div class="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
            <BkIcon icon="check" class="w-3 h-3 text-primary" />
          </div>
          <p class="text-muted-foreground">
            <span class="text-foreground font-medium">Multiple boards</span> - Create and manage as many boards as you need
          </p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <p class="text-sm text-destructive">{{ error }}</p>
      </div>
    </div>

    <template #footer>
      <BkButton
        variant="default"
        :loading="isLoading"
        :disabled="isLoading"
        @click="handleSelectFolder"
      >
        <BkIcon icon="folder-open" class="w-4 h-4" />
        Select Vault Folder
      </BkButton>
    </template>
  </BkModal>
</template>
