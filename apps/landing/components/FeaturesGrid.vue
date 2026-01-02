<script setup lang="ts">
const features = [
  {
    icon: 'i-lucide-palette',
    title: 'Infinite Canvas',
    description: 'Draw, sketch, and organize freely on an endless workspace. Native shapes, arrows, freehand drawing, and text — all the tools you need.',
  },
  {
    icon: 'i-lucide-boxes',
    title: '11 Built-in Modules',
    description: 'Todo lists, Pomodoro timer, Kanban boards, habit tracker, and more. Productivity widgets that actually work together.',
  },
  {
    icon: 'i-lucide-wifi-off',
    title: '100% Offline',
    description: 'Your data stays on your device. No account required, no cloud dependency, no tracking. Works perfectly in airplane mode.',
  },
  {
    icon: 'i-lucide-share-2',
    title: 'Cross-Module Data',
    description: 'Widgets talk to each other through versioned contracts. Your Stats card can pull data from Todos, Timer, and Habits. Unique to Boardkit.',
  },
]
</script>

<template>
  <section id="features" class="section-padding">
    <div class="container-landing">
      <!-- Section header - CHALK EDITION: Serif headings -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="heading-2 font-serif mb-4">
          Everything you need, nothing you don't
        </h2>
        <p class="body-large">
          A focused toolkit for visual thinking and personal productivity.
          No bloat, no complexity, no vendor lock-in.
        </p>
      </div>

      <!-- Features grid -->
      <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="card-interactive p-6 lg:p-8 group"
        >
          <div class="flex items-start gap-4">
            <div class="shrink-0 w-12 h-12 rounded-xl border border-border bg-muted/30 flex items-center justify-center transition-colors group-hover:bg-muted/50">
              <span :class="feature.icon" class="text-foreground text-xl" />
            </div>
            <div>
              <h3 class="heading-3 font-serif mb-2">{{ feature.title }}</h3>
              <p class="body">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
