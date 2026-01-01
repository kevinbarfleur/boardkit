<script setup lang="ts">
</script>

<template>
  <section class="section-padding bg-card/50 border-t border-border relative overflow-hidden">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-radial-gradient opacity-50" />

    <div class="container-landing relative">
      <div class="text-center max-w-2xl mx-auto">
        <h2 class="heading-2 mb-4">
          Ready to own your whiteboard?
        </h2>
        <p class="body-large mb-8">
          No account. No cloud. Just you and your ideas.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
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
      </div>
    </div>
  </section>
</template>
