<script setup lang="ts">
// Stats displayed below CTAs
const stats = [
  { value: '11', label: 'Modules' },
  { value: '100%', label: 'Offline' },
  { value: 'Open', label: 'Source' },
]
</script>

<template>
  <section class="relative pt-32 pb-16 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
    <!-- Background patterns - Tailwind style dot pattern -->
    <div class="absolute inset-0 bg-dot-pattern opacity-40" />
    <div class="absolute inset-0 bg-radial-gradient" />

    <div class="container-landing relative">
      <div class="max-w-4xl mx-auto text-center">
        <!-- Badge - CHALK EDITION: Subtle border style -->
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border text-sm text-muted-foreground mb-8 animate-fade-in-down"
        >
          <span class="i-lucide-sparkles text-sm" />
          <span>Open source & offline-first</span>
        </div>

        <!-- Headline - CHALK EDITION: Serif font -->
        <h1 class="heading-1 font-serif mb-6 animate-fade-in-up">
          The whiteboard that
          <span class="font-cursive text-foreground">truly belongs</span>
          to you
        </h1>

        <!-- Subheadline -->
        <p class="body-large max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-1">
          An infinite canvas with productivity widgets that works 100% offline.
          Your data stays on your device. No cloud, no account, no tracking.
        </p>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up stagger-2">
          <a
            href="https://app.boardkit.sh"
            class="btn-primary btn-lg w-full sm:w-auto"
          >
            <span class="i-lucide-play" />
            Try Online
          </a>
          <a
            href="https://github.com/kevinbarfleur/boardkit/releases"
            target="_blank"
            rel="noopener"
            class="btn-outline btn-lg w-full sm:w-auto"
          >
            <span class="i-lucide-download" />
            Download for macOS
          </a>
        </div>

        <!-- Demo Placeholder -->
        <DemoPlaceholder class="animate-scale-in stagger-3" />
      </div>
    </div>

    <!-- Stats Section -->
    <div class="mt-16 py-12 border-y border-border bg-card/50">
      <div class="container-landing">
        <div class="flex flex-wrap justify-center gap-12 md:gap-20">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="text-center"
          >
            <div class="text-3xl md:text-4xl font-bold font-serif text-foreground mb-1">
              {{ stat.value }}
            </div>
            <div class="text-sm text-muted-foreground">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
