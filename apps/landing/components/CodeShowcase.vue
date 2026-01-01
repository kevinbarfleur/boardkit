<script setup lang="ts">
const tabs = [
  { id: 'basic', label: 'Basic Module' },
  { id: 'settings', label: 'With Settings' },
  { id: 'data-sharing', label: 'Data Sharing' },
]

const activeTab = ref('basic')

const codeExamples = {
  basic: `import { defineModule } from '@boardkit/core'
import CounterWidget from './CounterWidget.vue'

export const CounterModule = defineModule({
  moduleId: 'counter',
  version: '1.0.0',
  displayName: 'Counter',
  icon: 'hash',
  component: CounterWidget,

  defaultState: () => ({
    count: 0,
    title: 'My Counter'
  }),

  serialize: (state) => state,
  deserialize: (data) => data,
})`,

  settings: `// Add a settings panel to your module
settingsSchema: {
  sections: [{
    id: 'display',
    title: 'Display Options',
    fields: [{
      key: 'showProgress',
      type: 'button-group',
      label: 'Progress indicator',
      options: [
        { value: 'none', label: 'None' },
        { value: 'bar', label: 'Progress Bar' },
        { value: 'percent', label: 'Percentage' },
      ],
    }, {
      key: 'autoSort',
      type: 'toggle',
      label: 'Auto-sort completed items',
    }],
  }],
}`,

  'data-sharing': `// Widget that PROVIDES data to others
export const TodoModule = defineModule({
  moduleId: 'todo',
  provides: [todoContractV1],
  // Other widgets can read your todos
})

// Widget that CONSUMES data from others
export const RadarModule = defineModule({
  moduleId: 'task-radar',
  consumes: [{
    contract: todoContractV1,
    stateKey: 'connectedWidgets',
    multi: true, // Connect to multiple sources
  }],
  // Aggregates data from all connected widgets
})`,
}

const explanations = {
  basic: {
    title: 'Create modules in minutes',
    description: 'Define your widget with a simple, declarative API. Boardkit handles state management, persistence, and undo/redo automatically.',
    highlights: [
      'Full TypeScript support',
      'Automatic persistence',
      'Built-in undo/redo',
    ],
  },
  settings: {
    title: 'Powerful configuration',
    description: 'Add a settings panel with toggles, button groups, inputs, and more. Users can customize each widget instance.',
    highlights: [
      'Declarative schema',
      'Multiple field types',
      'Per-widget settings',
    ],
  },
  'data-sharing': {
    title: 'Widgets that communicate',
    description: 'Unique to Boardkit: widgets can share data through versioned contracts. Build dashboards that aggregate from multiple sources.',
    highlights: [
      'Versioned contracts',
      'Multi-source aggregation',
      'Reactive updates',
    ],
  },
}
</script>

<template>
  <section class="section-padding">
    <div class="container-landing">
      <!-- Section header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-4">
          <span class="i-lucide-code text-xs" />
          <span>Developer Experience</span>
        </div>
        <h2 class="heading-2 mb-4">
          Build your own modules
        </h2>
        <p class="body-large">
          Extend Boardkit with custom widgets using a simple, powerful API.
          Full TypeScript support, automatic persistence, and reactive state management.
        </p>
      </div>

      <!-- Code showcase -->
      <div class="max-w-5xl mx-auto">
        <div class="grid lg:grid-cols-5 gap-8">
          <!-- Code panel (3 cols) -->
          <div class="lg:col-span-3">
            <!-- Tabs -->
            <div class="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all"
                :class="[
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Code block -->
            <CodeBlock
              :code="codeExamples[activeTab as keyof typeof codeExamples]"
              lang="typescript"
            />
          </div>

          <!-- Explanation panel (2 cols) -->
          <div class="lg:col-span-2 flex flex-col justify-center">
            <Transition
              mode="out-in"
              enter-active-class="transition-all duration-200"
              leave-active-class="transition-all duration-200"
              enter-from-class="opacity-0 translate-x-4"
              enter-to-class="opacity-100 translate-x-0"
              leave-from-class="opacity-100 translate-x-0"
              leave-to-class="opacity-0 -translate-x-4"
            >
              <div :key="activeTab">
                <h3 class="heading-3 mb-3">
                  {{ explanations[activeTab as keyof typeof explanations].title }}
                </h3>
                <p class="body mb-6">
                  {{ explanations[activeTab as keyof typeof explanations].description }}
                </p>
                <ul class="space-y-3">
                  <li
                    v-for="highlight in explanations[activeTab as keyof typeof explanations].highlights"
                    :key="highlight"
                    class="flex items-center gap-3"
                  >
                    <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span class="i-lucide-check text-primary text-xs" />
                    </div>
                    <span class="body-small text-foreground">{{ highlight }}</span>
                  </li>
                </ul>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
