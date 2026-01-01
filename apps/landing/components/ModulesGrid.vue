<script setup lang="ts">
const modules = [
  { icon: 'i-lucide-check-square', name: 'Todo', desc: 'Tasks & checklists' },
  { icon: 'i-lucide-timer', name: 'Timer', desc: 'Pomodoro focus' },
  { icon: 'i-lucide-columns-3', name: 'Kanban', desc: 'Drag & drop boards' },
  { icon: 'i-lucide-bar-chart-3', name: 'Stats', desc: 'Cross-widget metrics' },
  { icon: 'i-lucide-file-text', name: 'Text', desc: 'Rich Markdown' },
  { icon: 'i-lucide-focus', name: 'Focus', desc: 'Single task view' },
  { icon: 'i-lucide-flame', name: 'Habits', desc: 'Streak tracking' },
  { icon: 'i-lucide-hash', name: 'Counter', desc: 'Track anything' },
  { icon: 'i-lucide-sticky-note', name: 'Notes', desc: 'Quick scratchpad' },
  { icon: 'i-lucide-radar', name: 'Radar', desc: 'Task aggregation' },
  { icon: 'i-lucide-calendar', name: 'Calendar', desc: 'Google Calendar' },
]
</script>

<template>
  <section id="modules" class="section-padding bg-card/50 border-y border-border">
    <div class="container-landing">
      <!-- Section header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="heading-2 mb-4">
          Built-in productivity modules
        </h2>
        <p class="body-large">
          11 widgets ready to use. Drop them on your canvas and start working.
          They can share data with each other seamlessly.
        </p>
      </div>

      <!-- Modules grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <div
          v-for="mod in modules"
          :key="mod.name"
          class="card-interactive p-4 text-center group"
        >
          <div class="w-14 h-14 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center transition-colors group-hover:bg-primary/10">
            <span :class="mod.icon" class="text-2xl text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 class="font-medium text-foreground text-sm mb-1">{{ mod.name }}</h3>
          <p class="text-xs text-muted-foreground">{{ mod.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
