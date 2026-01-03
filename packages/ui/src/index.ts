// Components
export { default as BkButton } from './components/BkButton.vue'
export { default as BkIconButton } from './components/BkIconButton.vue'
export { default as BkIcon } from './components/BkIcon.vue'
export { default as BkInput } from './components/BkInput.vue'
export { default as BkSearchInput } from './components/BkSearchInput.vue'
export { default as BkTextarea } from './components/BkTextarea.vue'
export { default as BkCheckbox } from './components/BkCheckbox.vue'
export { default as BkDropdown } from './components/BkDropdown.vue'
export type { DropdownItem } from './components/BkDropdown.vue'
export { default as BkMenu } from './components/BkMenu.vue'
export { default as BkHistoryList } from './components/BkHistoryList.vue'
export { default as BkModal } from './components/BkModal.vue'
export type { ModalSize } from './components/BkModal.vue'
export { default as BkConfirmDialog } from './components/BkConfirmDialog.vue'
export { default as BkDataConnectionDialog } from './components/BkDataConnectionDialog.vue'
export { default as BkDataSourcePicker } from './components/BkDataSourcePicker.vue'
export type { ProviderInfo } from './components/BkDataSourcePicker.vue'
export { default as BkTooltip } from './components/BkTooltip.vue'
export { default as BkDivider } from './components/BkDivider.vue'
export { default as BkEditableText } from './components/BkEditableText.vue'
export { default as BkEditableInput } from './components/BkEditableInput.vue'
export { default as WidgetFrame } from './components/WidgetFrame.vue'
export { default as BkContextMenu } from './components/BkContextMenu.vue'

// Form Components
export { default as BkToggle } from './components/BkToggle.vue'
export { default as BkSelect } from './components/BkSelect.vue'
export { default as BkTagInput } from './components/BkTagInput.vue'
export { default as BkMultiSelect } from './components/BkMultiSelect.vue'
export type { MultiSelectOption } from './components/BkMultiSelect.vue'
export type { SelectOption } from './components/BkSelect.vue'
export { default as BkButtonGroup } from './components/BkButtonGroup.vue'
export type { ButtonGroupOption } from './components/BkButtonGroup.vue'
export { default as BkDatePicker } from './components/BkDatePicker.vue'
export { default as BkSecretInput } from './components/BkSecretInput.vue'
export { default as BkFormRow } from './components/BkFormRow.vue'
export { default as BkFormSection } from './components/BkFormSection.vue'
export { default as BkTabs } from './components/BkTabs.vue'
export type { Tab as BkTab } from './components/BkTabs.vue'

// Configuration Components
export { default as BkSetupRequired } from './components/BkSetupRequired.vue'
export { default as BkSourcePicker } from './components/BkSourcePicker.vue'
export type { SourcePickerProvider } from './components/BkSourcePicker.vue'
export { default as BkSourcePickerGroup } from './components/BkSourcePickerGroup.vue'
export type { ContractGroup } from './components/BkSourcePickerGroup.vue'
export { default as BkConfiguredItemsList } from './components/BkConfiguredItemsList.vue'
export type { ConfiguredItem } from './components/BkConfiguredItemsList.vue'
export { default as BkAddItemWizard } from './components/BkAddItemWizard.vue'
export type { WizardStep, WizardOption } from './components/BkAddItemWizard.vue'
export { default as BkConfigurationPanel } from './components/BkConfigurationPanel.vue'
export type { ConfigPanelProvider } from './components/BkConfigurationPanel.vue'
export { default as BkSettingsPanelGeneric } from './components/BkSettingsPanelGeneric.vue'
export { default as BkModuleSettingsPanel } from './components/BkModuleSettingsPanel.vue'
export { default as BkSchemaForm } from './components/BkSchemaForm.vue'

// Modal Components
export { default as BkModalProvider } from './components/BkModalProvider.vue'
export { default as BkFormModal } from './components/BkFormModal.vue'
export { default as BkFullScreenAlert } from './components/BkFullScreenAlert.vue'
export { default as BkImagePickerModal } from './components/BkImagePickerModal.vue'
export type { ImageAsset, ImagePickerResult } from './components/BkImagePickerModal.vue'

// Plugin Components
export { default as BkPluginCard } from './components/BkPluginCard.vue'
export type { PluginInfo } from './components/BkPluginCard.vue'
export { default as BkPluginSettings } from './components/BkPluginSettings.vue'

// Toast Components
export { default as BkToastProvider } from './components/BkToastProvider.vue'
export { default as BkToast } from './components/BkToast.vue'

// Menu Bar
export { default as BkMenuBar } from './components/BkMenuBar.vue'

// Canvas Tool Components
export { default as BkToolbar } from './components/BkToolbar.vue'
export { default as BkToolButton } from './components/BkToolButton.vue'
export { default as BkColorPicker } from './components/BkColorPicker.vue'
export { default as BkColorPickerPresets } from './components/BkColorPickerPresets.vue'
export { default as BkColorPickerGradient } from './components/BkColorPickerGradient.vue'
export { default as BkColorPickerHueSlider } from './components/BkColorPickerHueSlider.vue'
export { default as BkColorPickerInput } from './components/BkColorPickerInput.vue'
export type { ColorFormat } from './components/BkColorPickerInput.vue'
export { default as BkSlider } from './components/BkSlider.vue'
export { default as SelectionHandles } from './components/SelectionHandles.vue'
export { default as GroupSelectionBox } from './components/GroupSelectionBox.vue'
export { default as ElementRenderer } from './components/ElementRenderer.vue'
export { default as GridOverlay } from './components/GridOverlay.vue'
export { default as AnchorPointsOverlay } from './components/AnchorPointsOverlay.vue'
export { default as OrthogonalArrow } from './components/OrthogonalArrow.vue'

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
export { useModal, MODAL_INJECTION_KEY } from './composables/useModal'
export { useToast, TOAST_INJECTION_KEY } from './composables/useToast'
export { useWidgetTransform, WIDGET_TRANSFORM_KEY, type WidgetTransform } from './composables/useWidgetTransform'
export { usePlatform, initPlatform, type Platform } from './composables/usePlatform'

// Modal Types
export type {
  ModalConfig,
  ModalResult,
  ConfirmConfig,
  UseModalReturn,
} from './types/modal'

// Toast Types
export type {
  Toast,
  ToastType,
  ToastOptions,
  UseToastReturn,
} from './types/toast'

// Types
export type { ButtonVariant } from './components/BkButton.vue'
export type { IconName } from './components/BkIcon.vue'

// Re-export element types used by ElementRenderer (from @boardkit/core)
export type {
  CanvasElement,
  ShapeElement,
  LineElement,
  DrawElement,
  TextElement,
} from '@boardkit/core'
