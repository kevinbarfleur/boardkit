<script setup lang="ts">
import { computed } from 'vue'
import {
  useBoardStore,
  actionRegistry,
  type ActionDefinition,
  type ActionContext,
  type ActionGroup,
} from '@boardkit/core'
import {
  BkCommandDialog,
  BkCommandInput,
  BkCommandList,
  BkCommandGroup,
  BkCommandItem,
  BkCommandEmpty,
} from '@boardkit/ui'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const boardStore = useBoardStore()

const actionContext = computed<ActionContext>(() => ({
  selectedWidget: boardStore.selectedWidget,
  selectedWidgetId: boardStore.selectedWidgetId,
  viewport: boardStore.viewport,
  widgets: boardStore.widgets,
  platform: 'desktop',
  isDirty: boardStore.isDirty,
}))

const availableActions = computed(() => {
  return actionRegistry.getAvailable(actionContext.value, { context: 'global' })
})

const groupedActions = computed(() => {
  const groups: Record<ActionGroup, ActionDefinition[]> = {
    board: [],
    widget: [],
    view: [],
    module: [],
  }

  for (const action of availableActions.value) {
    groups[action.group].push(action)
  }

  return groups
})

const groupLabels: Record<ActionGroup, string> = {
  board: 'Board',
  widget: 'Widget',
  view: 'View',
  module: 'Modules',
}

const handleSelect = async (value: string) => {
  // Find the action by its ID (we use action.id as the value)
  const action = availableActions.value.find(a => a.id === value)
  if (action) {
    await actionRegistry.execute(action.id, actionContext.value)
  }
}

const close = () => {
  emit('close')
}
</script>

<template>
  <BkCommandDialog
    :open="props.open"
    :loop="true"
    @close="close"
    @select="handleSelect"
  >
    <template #default="{ listboxId, activeDescendant }">
      <BkCommandInput
        placeholder="Rechercher des commandes..."
        :listbox-id="listboxId"
        :active-descendant="activeDescendant"
      />

      <BkCommandList :id="listboxId" label="Commands">
        <BkCommandEmpty>
          Aucun résultat trouvé.
        </BkCommandEmpty>

        <template v-for="(actions, group) in groupedActions" :key="group">
          <BkCommandGroup
            v-if="actions.length > 0"
            :heading="groupLabels[group as ActionGroup]"
          >
            <BkCommandItem
              v-for="action in actions"
              :key="action.id"
              :value="action.id"
              :icon="action.icon"
              :shortcut="action.shortcutHint"
              :keywords="[action.title, ...(action.keywords || [])]"
              :group="group"
              @select="handleSelect"
            >
              {{ action.title }}
            </BkCommandItem>
          </BkCommandGroup>
        </template>
      </BkCommandList>
    </template>
  </BkCommandDialog>
</template>
