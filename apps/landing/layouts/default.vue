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
        </div>

        <!-- CTA -->
        <div class="flex items-center gap-3">
          <a
            href="#"
            class="btn-primary btn-sm hidden sm:inline-flex"
            @click.prevent="document.querySelector('input[type=email]')?.focus()"
          >
            <span class="i-lucide-mail text-sm" />
            Get Notified
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
        <div class="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12">
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
            <p class="body-small max-w-xs mt-2 text-primary">
              Coming soon.
            </p>
          </div>

          <!-- Product -->
          <div>
            <h4 class="font-medium text-foreground mb-4">Product</h4>
            <ul class="space-y-3">
              <li><a href="#features" class="body-small hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#modules" class="body-small hover:text-foreground transition-colors">Modules</a></li>
              <li><a href="#pricing" class="body-small hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="font-medium text-foreground mb-4">Contact</h4>
            <ul class="space-y-3">
              <li>
                <a href="mailto:hello@boardkit.sh" class="body-small hover:text-foreground transition-colors inline-flex items-center gap-2">
                  <span class="i-lucide-mail" />
                  hello@boardkit.sh
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
