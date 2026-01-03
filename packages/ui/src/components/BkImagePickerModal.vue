<script setup lang="ts">
import { ref, computed } from 'vue'
import BkModal from './BkModal.vue'
import BkIcon from './BkIcon.vue'

/**
 * BkImagePickerModal
 *
 * Modal for selecting images - either from existing assets or by importing new ones.
 */

export interface ImageAsset {
  id: string
  url: string
  filename: string
  size: number
}

export interface ImagePickerResult {
  type: 'existing' | 'new'
  assetId?: string
  files?: File[]
}

interface Props {
  open: boolean
  assets?: ImageAsset[]
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  assets: () => [],
  multiple: false,
})

const emit = defineEmits<{
  close: []
  select: [result: ImagePickerResult]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const sortedAssets = computed(() => [...props.assets].reverse())

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function handleSelectAsset(assetId: string) {
  emit('select', { type: 'existing', assetId })
  emit('close')
}

function handleImportClick() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) {
    emit('select', { type: 'new', files: Array.from(files) })
    emit('close')
  }
  input.value = ''
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BkModal :open="open" title="Add Image" @close="handleClose">
    <div class="flex flex-col gap-4">
      <!-- Import button -->
      <button
        class="flex items-center justify-center gap-2 w-full h-11 bg-accent hover:bg-accent/80 border border-border hover:border-border-strong rounded-lg text-foreground text-sm font-medium transition-colors"
        @click="handleImportClick"
      >
        <BkIcon icon="folder-open" :size="18" />
        <span>Browse files...</span>
      </button>

      <!-- Existing assets -->
      <template v-if="sortedAssets.length > 0">
        <!-- Divider -->
        <div class="flex items-center gap-3 text-muted-foreground text-xs uppercase tracking-wide">
          <div class="flex-1 h-px bg-border" />
          <span>Project images</span>
          <div class="flex-1 h-px bg-border" />
        </div>

        <!-- Grid: 4 columns, full width -->
        <div class="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto">
          <button
            v-for="asset in sortedAssets"
            :key="asset.id"
            class="flex flex-col rounded-lg border border-transparent hover:border-border transition-colors p-2"
            @click="handleSelectAsset(asset.id)"
          >
            <!-- Thumbnail: fixed aspect ratio, image fills uniformly -->
            <div class="w-full aspect-square bg-muted rounded-md overflow-hidden">
              <img
                :src="asset.url"
                :alt="asset.filename"
                class="w-full h-full object-cover"
              />
            </div>
            <!-- Meta -->
            <div class="pt-1.5 text-center">
              <p class="text-[11px] text-foreground truncate">{{ asset.filename }}</p>
              <p class="text-[10px] text-muted-foreground">{{ formatSize(asset.size) }}</p>
            </div>
          </button>
        </div>
      </template>

      <!-- Hidden input -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        :multiple="multiple"
        class="sr-only"
        @change="handleFileChange"
      />
    </div>
  </BkModal>
</template>
