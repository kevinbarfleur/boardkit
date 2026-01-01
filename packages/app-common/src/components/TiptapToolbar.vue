<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { BkIcon, BkDivider } from '@boardkit/ui'

interface Props {
  editor: Editor | null
}

const props = defineProps<Props>()

interface ToolbarAction {
  icon: string
  command: string
  label: string
  isActive?: string
}

const formatActions: ToolbarAction[] = [
  { icon: 'bold', command: 'toggleBold', label: 'Bold', isActive: 'bold' },
  { icon: 'italic', command: 'toggleItalic', label: 'Italic', isActive: 'italic' },
  { icon: 'underline', command: 'toggleUnderline', label: 'Underline', isActive: 'underline' },
  { icon: 'strikethrough', command: 'toggleStrike', label: 'Strikethrough', isActive: 'strike' },
  { icon: 'code', command: 'toggleCode', label: 'Code', isActive: 'code' },
]

const blockActions: ToolbarAction[] = [
  { icon: 'list', command: 'toggleBulletList', label: 'Bullet List', isActive: 'bulletList' },
  { icon: 'list-ordered', command: 'toggleOrderedList', label: 'Ordered List', isActive: 'orderedList' },
  { icon: 'list-todo', command: 'toggleTaskList', label: 'Task List', isActive: 'taskList' },
  { icon: 'quote', command: 'toggleBlockquote', label: 'Quote', isActive: 'blockquote' },
  { icon: 'braces', command: 'toggleCodeBlock', label: 'Code Block', isActive: 'codeBlock' },
]

const executeCommand = (command: string) => {
  if (!props.editor) return

  const chain = props.editor.chain().focus()

  // Handle special commands
  switch (command) {
    case 'toggleBold':
      chain.toggleBold().run()
      break
    case 'toggleItalic':
      chain.toggleItalic().run()
      break
    case 'toggleUnderline':
      chain.toggleUnderline().run()
      break
    case 'toggleStrike':
      chain.toggleStrike().run()
      break
    case 'toggleCode':
      chain.toggleCode().run()
      break
    case 'toggleBulletList':
      chain.toggleBulletList().run()
      break
    case 'toggleOrderedList':
      chain.toggleOrderedList().run()
      break
    case 'toggleTaskList':
      chain.toggleTaskList().run()
      break
    case 'toggleBlockquote':
      chain.toggleBlockquote().run()
      break
    case 'toggleCodeBlock':
      chain.toggleCodeBlock().run()
      break
    case 'heading1':
      chain.toggleHeading({ level: 1 }).run()
      break
    case 'heading2':
      chain.toggleHeading({ level: 2 }).run()
      break
    case 'heading3':
      chain.toggleHeading({ level: 3 }).run()
      break
    default:
      break
  }
}

const isActive = (name: string) => {
  if (!props.editor) return false
  return props.editor.isActive(name)
}
</script>

<template>
  <div
    v-if="editor"
    class="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/30"
  >
    <!-- Headings -->
    <button
      class="h-7 px-2 rounded text-xs font-medium transition-colors"
      :class="isActive('heading') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'"
      @click="executeCommand('heading1')"
      title="Heading 1"
    >
      H1
    </button>
    <button
      class="h-7 px-2 rounded text-xs font-medium transition-colors"
      :class="isActive('heading') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'"
      @click="executeCommand('heading2')"
      title="Heading 2"
    >
      H2
    </button>
    <button
      class="h-7 px-2 rounded text-xs font-medium transition-colors"
      :class="isActive('heading') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'"
      @click="executeCommand('heading3')"
      title="Heading 3"
    >
      H3
    </button>

    <BkDivider orientation="vertical" class="h-5 mx-1" />

    <!-- Format buttons -->
    <button
      v-for="action in formatActions"
      :key="action.icon"
      class="h-7 w-7 rounded flex items-center justify-center transition-colors"
      :class="isActive(action.isActive || '') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'"
      :title="action.label"
      @click="executeCommand(action.command)"
    >
      <BkIcon :icon="action.icon" :size="14" />
    </button>

    <BkDivider orientation="vertical" class="h-5 mx-1" />

    <!-- Block buttons -->
    <button
      v-for="action in blockActions"
      :key="action.icon"
      class="h-7 w-7 rounded flex items-center justify-center transition-colors"
      :class="isActive(action.isActive || '') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent text-muted-foreground hover:text-foreground'"
      :title="action.label"
      @click="executeCommand(action.command)"
    >
      <BkIcon :icon="action.icon" :size="14" />
    </button>
  </div>
</template>
