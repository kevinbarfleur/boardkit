<script setup lang="ts">
import { watch, onBeforeUnmount, computed } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

// Create lowlight instance with common languages
const lowlight = createLowlight(common)

// Type for the Markdown extension's storage
interface MarkdownStorage {
  getMarkdown: () => string
}

// Helper to get markdown from editor
function getMarkdownFromEditor(editor: { storage: unknown }): string {
  const storage = editor.storage as { markdown: MarkdownStorage }
  return storage.markdown.getMarkdown()
}

interface Props {
  modelValue: string
  placeholder?: string
  editable?: boolean
  fontSize?: 'small' | 'medium' | 'large'
  lineHeight?: 'compact' | 'normal' | 'spacious'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Start typing...',
  editable: true,
  fontSize: 'medium',
  lineHeight: 'normal',
})

// Compute font size class
const fontSizeClass = computed(() => {
  switch (props.fontSize) {
    case 'small': return 'text-size-small'
    case 'large': return 'text-size-large'
    default: return 'text-size-medium'
  }
})

// Compute line height class
const lineHeightClass = computed(() => {
  switch (props.lineHeight) {
    case 'compact': return 'line-height-compact'
    case 'spacious': return 'line-height-spacious'
    default: return 'line-height-normal'
  }
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      // Disable default code block in favor of lowlight version
      codeBlock: false,
      // Configure heading levels
      heading: {
        levels: [1, 2, 3, 4],
      },
    }),
    Markdown.configure({
      html: false,
      tightLists: true,
      bulletListMarker: '-',
      linkify: true,
      breaks: true,
      transformPastedText: true,
      transformCopiedText: true,
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
    Typography,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
  ],
  onUpdate: ({ editor }) => {
    // Get content as markdown
    const markdown = getMarkdownFromEditor(editor)
    emit('update:modelValue', markdown)
  },
  editorProps: {
    attributes: {
      class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none',
    },
  },
})

// Watch for external content changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (!editor.value) return

    const currentMarkdown = getMarkdownFromEditor(editor.value)
    if (newValue !== currentMarkdown) {
      editor.value.commands.setContent(newValue)
    }
  }
)

// Watch for editable changes
watch(
  () => props.editable,
  (editable) => {
    editor.value?.setEditable(editable)
  }
)

// Cleanup
onBeforeUnmount(() => {
  editor.value?.destroy()
})

// Expose editor for parent access if needed
defineExpose({
  editor,
  focus: () => editor.value?.commands.focus(),
})
</script>

<template>
  <div class="tiptap-wrapper h-full" :class="[fontSizeClass, lineHeightClass]">
    <EditorContent :editor="editor" class="h-full" />
  </div>
</template>

<style>
/* Editor container */
.tiptap-wrapper {
  height: 100%;
}

/* Font size variants */
.tiptap-wrapper.text-size-small .tiptap {
  font-size: 0.8125rem; /* 13px */
}

.tiptap-wrapper.text-size-medium .tiptap {
  font-size: 0.875rem; /* 14px */
}

.tiptap-wrapper.text-size-large .tiptap {
  font-size: 1rem; /* 16px */
}

/* Line height variants */
.tiptap-wrapper.line-height-compact .tiptap {
  line-height: 1.4;
}

.tiptap-wrapper.line-height-normal .tiptap {
  line-height: 1.6;
}

.tiptap-wrapper.line-height-spacious .tiptap {
  line-height: 1.8;
}

.tiptap-wrapper .tiptap {
  height: 100%;
  overflow-y: auto;
}

/* Placeholder styling */
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}

/* Base text color */
.tiptap-editor {
  color: hsl(var(--foreground));
  caret-color: hsl(var(--foreground));
}

/* Headings */
.tiptap-editor h1 {
  font-size: 1.75em;
  font-weight: 700;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
  color: hsl(var(--foreground));
}

.tiptap-editor h2 {
  font-size: 1.4em;
  font-weight: 600;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
  color: hsl(var(--foreground));
}

.tiptap-editor h3 {
  font-size: 1.2em;
  font-weight: 600;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
  color: hsl(var(--foreground));
}

.tiptap-editor h4 {
  font-size: 1.1em;
  font-weight: 600;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
  color: hsl(var(--foreground));
}

/* Paragraphs */
.tiptap-editor p {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
  color: hsl(var(--foreground));
}

/* Bold and italic */
.tiptap-editor strong {
  font-weight: 700;
  color: hsl(var(--foreground));
}

.tiptap-editor em {
  font-style: italic;
}

/* Lists */
.tiptap-editor ul,
.tiptap-editor ol {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
  padding-left: 1.5em;
}

.tiptap-editor li {
  margin-top: 0.1em;
  margin-bottom: 0.1em;
}

.tiptap-editor li p {
  margin: 0;
}

/* Task lists */
.tiptap-editor ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}

.tiptap-editor ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}

.tiptap-editor ul[data-type="taskList"] li > label {
  flex-shrink: 0;
  margin-top: 0.25em;
}

.tiptap-editor ul[data-type="taskList"] li > label input[type="checkbox"] {
  width: 1em;
  height: 1em;
  accent-color: hsl(var(--primary));
  cursor: pointer;
}

.tiptap-editor ul[data-type="taskList"] li > div {
  flex: 1;
}

/* Inline code */
.tiptap-editor code {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  padding: 0.15em 0.4em;
  border-radius: 0.25em;
  font-size: 0.9em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Code blocks */
.tiptap-editor pre {
  background: hsl(var(--muted));
  border-radius: 0.5em;
  padding: 0.75em 1em;
  margin: 0.5em 0;
  overflow-x: auto;
}

.tiptap-editor pre code {
  background: none;
  padding: 0;
  font-size: 0.85em;
  color: hsl(var(--foreground));
}

/* Blockquotes */
.tiptap-editor blockquote {
  border-left: 3px solid hsl(var(--border));
  padding-left: 1em;
  margin: 0.5em 0;
  color: hsl(var(--muted-foreground));
  font-style: italic;
}

/* Links */
.tiptap-editor a {
  color: hsl(var(--primary));
  text-decoration: underline;
  cursor: pointer;
}

.tiptap-editor a:hover {
  opacity: 0.8;
}

/* Horizontal rule */
.tiptap-editor hr {
  border: none;
  border-top: 1px solid hsl(var(--border));
  margin: 1em 0;
}

/* Strikethrough */
.tiptap-editor s {
  text-decoration: line-through;
  opacity: 0.7;
}

/* Selection */
.tiptap-editor ::selection {
  background: hsl(var(--primary) / 0.3);
}

/* Syntax highlighting for code blocks */
.tiptap-editor .hljs-comment,
.tiptap-editor .hljs-quote {
  color: hsl(var(--muted-foreground));
  font-style: italic;
}

.tiptap-editor .hljs-keyword,
.tiptap-editor .hljs-selector-tag,
.tiptap-editor .hljs-addition {
  color: #c792ea;
}

.tiptap-editor .hljs-number,
.tiptap-editor .hljs-string,
.tiptap-editor .hljs-meta .hljs-meta-string,
.tiptap-editor .hljs-literal,
.tiptap-editor .hljs-doctag,
.tiptap-editor .hljs-regexp {
  color: #c3e88d;
}

.tiptap-editor .hljs-title,
.tiptap-editor .hljs-section,
.tiptap-editor .hljs-name,
.tiptap-editor .hljs-selector-id,
.tiptap-editor .hljs-selector-class {
  color: #82aaff;
}

.tiptap-editor .hljs-attribute,
.tiptap-editor .hljs-attr,
.tiptap-editor .hljs-variable,
.tiptap-editor .hljs-template-variable,
.tiptap-editor .hljs-class .hljs-title,
.tiptap-editor .hljs-type {
  color: #ffcb6b;
}

.tiptap-editor .hljs-symbol,
.tiptap-editor .hljs-bullet,
.tiptap-editor .hljs-subst,
.tiptap-editor .hljs-meta,
.tiptap-editor .hljs-meta .hljs-keyword,
.tiptap-editor .hljs-selector-attr,
.tiptap-editor .hljs-selector-pseudo,
.tiptap-editor .hljs-link {
  color: #89ddff;
}

.tiptap-editor .hljs-built_in,
.tiptap-editor .hljs-deletion {
  color: #ff5370;
}

.tiptap-editor .hljs-formula {
  background: hsl(var(--muted));
}

.tiptap-editor .hljs-emphasis {
  font-style: italic;
}

.tiptap-editor .hljs-strong {
  font-weight: bold;
}
</style>
