// Components
export { default as BkButton } from './components/BkButton.vue'
export { default as BkIconButton } from './components/BkIconButton.vue'
export { default as BkIcon } from './components/BkIcon.vue'
export { default as BkInput } from './components/BkInput.vue'
export { default as BkTextarea } from './components/BkTextarea.vue'
export { default as BkCheckbox } from './components/BkCheckbox.vue'
export { default as BkDropdown } from './components/BkDropdown.vue'
export { default as BkMenu } from './components/BkMenu.vue'
export { default as BkHistoryList } from './components/BkHistoryList.vue'
export { default as BkModal } from './components/BkModal.vue'
export { default as BkTooltip } from './components/BkTooltip.vue'
export { default as BkDivider } from './components/BkDivider.vue'
export { default as BkEditableText } from './components/BkEditableText.vue'
export { default as WidgetFrame } from './components/WidgetFrame.vue'
export { default as BkContextMenu } from './components/BkContextMenu.vue'

// Canvas Tool Components
export { default as BkToolbar } from './components/BkToolbar.vue'
export { default as BkToolButton } from './components/BkToolButton.vue'
export { default as BkColorPicker } from './components/BkColorPicker.vue'
export { default as BkSlider } from './components/BkSlider.vue'
export { default as SelectionHandles } from './components/SelectionHandles.vue'
export { default as ElementRenderer } from './components/ElementRenderer.vue'

// Menu types
export type { MenuItem, MenuGroup, MenuContent } from './components/BkMenu.vue'
export type { HistoryItem } from './components/BkHistoryList.vue'
export type {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuItemOrSeparator,
} from './components/BkContextMenu.vue'

// Command Palette Components
export {
  BkCommandDialog,
  BkCommandInput,
  BkCommandList,
  BkCommandGroup,
  BkCommandItem,
  BkCommandEmpty,
} from './components/command'

// Composables
export { useTheme } from './composables/useTheme'

// Types
export type { ButtonVariant, ButtonSize } from './components/BkButton.vue'
export type { IconName } from './components/BkIcon.vue'

// Re-export element types used by ElementRenderer (from @boardkit/core)
export type {
  CanvasElement,
  ShapeElement,
  LineElement,
  DrawElement,
  TextElement,
} from '@boardkit/core'
