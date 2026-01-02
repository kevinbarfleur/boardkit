<script setup lang="ts">
</script>

<template>
  <div class="landing">
    <!-- Interactive canvas background (client-side only) -->
    <ClientOnly>
      <DemoCanvas />
      <DemoToolbar />
    </ClientOnly>

    <!-- Header -->
    <header class="header landing-content">
      <div class="container">
        <NuxtLink to="/" class="logo-mark">
          <span class="letter-b">B</span><span class="letter-k">K</span>
        </NuxtLink>
        <nav class="nav">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="https://github.com/kevinbarfleur/boardkit" target="_blank" rel="noopener">Docs</a>
          <a href="https://github.com/kevinbarfleur/boardkit" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </div>
    </header>

    <!-- Main content -->
    <main class="container landing-content">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="footer landing-content">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <NuxtLink to="/" class="logo-mark footer-logo">
              <span class="letter-b">B</span><span class="letter-k">K</span>
            </NuxtLink>
            <p>The offline-first modular whiteboard.</p>
          </div>
          <div class="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="https://github.com/kevinbarfleur/boardkit/releases" target="_blank" rel="noopener">Download</a>
          </div>
          <div class="footer-col">
            <h4>Resources</h4>
            <a href="https://github.com/kevinbarfleur/boardkit" target="_blank" rel="noopener">Documentation</a>
            <a href="https://github.com/kevinbarfleur/boardkit/releases" target="_blank" rel="noopener">Changelog</a>
            <a href="https://status.boardkit.sh" target="_blank" rel="noopener">Status</a>
          </div>
          <div class="footer-col">
            <h4>Connect</h4>
            <a href="https://twitter.com/boardkit" target="_blank" rel="noopener">Twitter</a>
            <a href="https://github.com/kevinbarfleur/boardkit" target="_blank" rel="noopener">GitHub</a>
            <a href="https://discord.gg/boardkit" target="_blank" rel="noopener">Discord</a>
          </div>
        </div>
        <div class="footer-bottom">
          © {{ new Date().getFullYear() }} Kevin Barfleur. Open source under AGPL-3.0.
        </div>
      </div>
    </footer>

    <!-- Grain texture overlay (topmost) -->
    <div class="grain-overlay" aria-hidden="true" />
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  position: relative;
}

/* Content sections */
.landing-content {
  position: relative;
  z-index: 10;
}

/* Grain overlay */
.grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.08;
  z-index: 1000;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='discrete' tableValues='0 1'/%3E%3CfeFuncG type='discrete' tableValues='0 1'/%3E%3CfeFuncB type='discrete' tableValues='0 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

/* Header - sticky navigation with backdrop blur */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 20px 0;
  border-bottom: 1px solid hsl(var(--border));
  background: rgba(23, 23, 23, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Logo Mark - BK in white circle */
.logo-mark {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: hsl(var(--foreground));
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-family: 'Source Serif 4', serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  transition: transform 0.15s ease;
  user-select: none;
}

.logo-mark:hover {
  transform: scale(1.05);
  text-decoration: none;
}

.logo-mark .letter-b {
  color: hsl(var(--background));
  position: relative;
  z-index: 2;
}

.logo-mark .letter-k {
  color: hsl(var(--background));
  margin-left: -5px;
  opacity: 0.55;
}

.nav {
  display: flex;
  gap: 24px;
  align-items: center;
}

.nav a {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  text-decoration: none;
}

.nav a:hover {
  color: hsl(var(--foreground));
}

/* Footer with backdrop blur */
.footer {
  border-top: 1px solid hsl(var(--border));
  padding: 40px 0;
  background: rgba(23, 23, 23, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.footer-brand .footer-logo {
  margin-bottom: 12px;
}

.footer-brand p {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.footer-col h4 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
  color: hsl(var(--foreground));
}

.footer-col a {
  display: block;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  text-decoration: none;
  padding: 4px 0;
}

.footer-col a:hover {
  color: hsl(var(--foreground));
}

.footer-bottom {
  padding-top: 24px;
  border-top: 1px solid hsl(var(--border));
  font-size: 13px;
  color: hsl(var(--text-subtle, var(--muted-foreground)));
}

/* Responsive */
@media (max-width: 520px) {
  .nav {
    gap: 12px;
    font-size: 13px;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
