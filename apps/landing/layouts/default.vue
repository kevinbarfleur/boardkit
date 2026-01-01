<script setup lang="ts">
const isScrolled = ref(false)

onMounted(() => {
  const handleScroll = () => {
    isScrolled.value = window.scrollY > 10
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Background effects -->
    <div class="fixed inset-0 bg-radial-gradient pointer-events-none" />
    <div class="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

    <!-- Header -->
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      :class="[
        isScrolled
          ? 'backdrop-blur-header border-b border-border/50'
          : 'bg-transparent'
      ]"
    >
      <nav class="container-landing h-16 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <span class="i-lucide-sparkles text-white text-lg" />
          </div>
          <span class="font-semibold text-lg text-foreground">Boardkit</span>
        </NuxtLink>

        <!-- Desktop Nav -->
        <div class="hidden md:flex items-center gap-1">
          <a href="#features" class="btn-ghost btn-sm">Features</a>
          <a href="#modules" class="btn-ghost btn-sm">Modules</a>
          <a href="#pricing" class="btn-ghost btn-sm">Pricing</a>
          <a
            href="https://github.com/kevinbarfleur/boardkit"
            target="_blank"
            rel="noopener"
            class="btn-ghost btn-sm"
          >
            <span class="i-lucide-github" />
            GitHub
          </a>
        </div>

        <!-- CTA -->
        <div class="flex items-center gap-3">
          <a
            href="https://github.com/kevinbarfleur/boardkit/releases"
            target="_blank"
            rel="noopener"
            class="btn-primary btn-sm hidden sm:inline-flex"
          >
            <span class="i-lucide-download text-sm" />
            Download
          </a>

          <!-- Mobile menu button -->
          <button
            class="md:hidden btn-ghost p-2"
            aria-label="Menu"
          >
            <span class="i-lucide-menu text-xl" />
          </button>
        </div>
      </nav>
    </header>

    <!-- Main content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-card border-t border-border">
      <div class="container-landing py-16">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <!-- Brand -->
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span class="i-lucide-sparkles text-white text-lg" />
              </div>
              <span class="font-semibold text-lg">Boardkit</span>
            </div>
            <p class="body-small max-w-xs">
              The offline-first modular whiteboard. Your data, your device.
            </p>
          </div>

          <!-- Product -->
          <div>
            <h4 class="font-medium text-foreground mb-4">Product</h4>
            <ul class="space-y-3">
              <li><a href="#features" class="body-small hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#modules" class="body-small hover:text-foreground transition-colors">Modules</a></li>
              <li><a href="#pricing" class="body-small hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="https://github.com/kevinbarfleur/boardkit/releases" class="body-small hover:text-foreground transition-colors">Download</a></li>
            </ul>
          </div>

          <!-- Resources -->
          <div>
            <h4 class="font-medium text-foreground mb-4">Resources</h4>
            <ul class="space-y-3">
              <li><a href="https://github.com/kevinbarfleur/boardkit" class="body-small hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="https://github.com/kevinbarfleur/boardkit/releases" class="body-small hover:text-foreground transition-colors">Changelog</a></li>
              <li><a href="https://github.com/kevinbarfleur/boardkit" class="body-small hover:text-foreground transition-colors">Source Code</a></li>
            </ul>
          </div>

          <!-- Connect -->
          <div>
            <h4 class="font-medium text-foreground mb-4">Connect</h4>
            <ul class="space-y-3">
              <li>
                <a href="https://twitter.com/boardkit" class="body-small hover:text-foreground transition-colors inline-flex items-center gap-2">
                  <span class="i-lucide-twitter" />
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://github.com/kevinbarfleur/boardkit" class="body-small hover:text-foreground transition-colors inline-flex items-center gap-2">
                  <span class="i-lucide-github" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom -->
        <div class="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p class="text-xs text-muted-foreground">
            © {{ new Date().getFullYear() }} Kevin Barfleur. Open source under AGPL-3.0.
          </p>
          <div class="flex items-center gap-4">
            <a href="#" class="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" class="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
