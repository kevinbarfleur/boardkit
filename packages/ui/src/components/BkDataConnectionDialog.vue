<script setup lang="ts">
import BkModal from './BkModal.vue'
import BkButton from './BkButton.vue'
import BkIcon from './BkIcon.vue'

interface Provider {
  id: string
  moduleId: string
  title?: string
}

interface Props {
  open: boolean
  title?: string
  contractName?: string
  availableProviders: Provider[]
  currentProvider?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Connect Data Source',
  contractName: 'data source',
  currentProvider: null,
})

const emit = defineEmits<{
  close: []
  connect: [providerId: string]
  disconnect: []
}>()

const isConnected = props.currentProvider !== null

function handleClose() {
  emit('close')
}

function handleConnect(providerId: string) {
  emit('connect', providerId)
  emit('close')
}

function handleDisconnect() {
  emit('disconnect')
  emit('close')
}
</script>

<template>
  <BkModal :open="open" :title="title" @close="handleClose">
    <div class="space-y-4">
      <!-- Current connection -->
      <div v-if="currentProvider" class="rounded-lg border border-border p-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <BkIcon icon="check-circle" :size="16" class="text-green-500" />
            <span class="text-sm font-medium text-foreground">Connected</span>
          </div>
          <BkButton variant="outline" size="sm" @click="handleDisconnect">
            Disconnect
          </BkButton>
        </div>
      </div>

      <!-- Available providers -->
      <div>
        <h4 class="text-sm font-medium text-muted-foreground mb-2">
          Available {{ contractName }}s:
        </h4>

        <div v-if="availableProviders.length === 0" class="text-sm text-muted-foreground py-4 text-center">
          No {{ contractName }}s found on this board.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="provider in availableProviders"
            :key="provider.id"
            class="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
          >
            <div class="flex items-center gap-2">
              <BkIcon icon="list-todo" :size="16" class="text-muted-foreground" />
              <span class="text-sm text-foreground">{{ provider.title || provider.moduleId }}</span>
            </div>
            <BkButton
              v-if="provider.id !== currentProvider"
              variant="outline"
              size="sm"
              @click="handleConnect(provider.id)"
            >
              Connect
            </BkButton>
            <span v-else class="text-xs text-green-500 font-medium">Connected</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <BkButton variant="outline" @click="handleClose">
        Close
      </BkButton>
    </template>
  </BkModal>
</template>
