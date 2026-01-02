<script setup lang="ts">
const steps = [
  {
    number: '1',
    title: 'Open',
    description: 'Launch the app or visit the website. No sign-up required.',
    icon: 'i-lucide-play',
  },
  {
    number: '2',
    title: 'Create',
    description: 'Draw on the canvas, add widgets, organize your thoughts.',
    icon: 'i-lucide-palette',
  },
  {
    number: '3',
    title: 'Own',
    description: 'Your data is saved locally. Export as .boardkit files anytime.',
    icon: 'i-lucide-download',
  },
]
</script>

<template>
  <section class="section-padding">
    <div class="container-landing">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="heading-2 font-serif mb-4">
          Simple by design
        </h2>
        <p class="body-large">
          No accounts, no setup wizards, no onboarding flows.
          Just open and start creating.
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
        <div
          v-for="step in steps"
          :key="step.number"
          class="text-center group"
        >
          <div class="relative mb-6">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
              <span class="text-2xl font-bold text-primary">{{ step.number }}</span>
            </div>
            <!-- Connector line (hidden on mobile, shown on desktop) -->
            <div
              v-if="step.number !== '3'"
              class="hidden md:block absolute top-1/2 left-full w-full h-px bg-border -translate-y-1/2"
            />
          </div>
          <h3 class="font-semibold text-foreground mb-2">{{ step.title }}</h3>
          <p class="body-small">
            {{ step.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
