<script setup lang="ts">
</script>

<template>
  <div class="landing">
    <!-- Grain texture overlay -->
    <div class="grain-overlay" aria-hidden="true" />

    <!-- Header -->
    <header class="header">
      <div class="container">
        <NuxtLink to="/" class="logo">Boardkit</NuxtLink>
        <nav class="nav">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="https://github.com/kevinbarfleur/boardkit" target="_blank" rel="noopener">Docs</a>
          <a href="https://github.com/kevinbarfleur/boardkit" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </div>
    </header>

    <!-- Main content -->
    <main class="container">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <NuxtLink to="/" class="logo">Boardkit</NuxtLink>
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
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  position: relative;
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

/* Header */
.header {
  padding: 20px 0;
  border-bottom: 1px solid hsl(var(--border));
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-family: 'Caveat', cursive;
  font-size: 24px;
  font-weight: 600;
  color: hsl(var(--foreground));
  text-decoration: none;
}

.logo:hover {
  text-decoration: none;
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

/* Footer */
.footer {
  border-top: 1px solid hsl(var(--border));
  padding: 40px 0;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

.footer-brand .logo {
  display: inline-block;
  margin-bottom: 8px;
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
@media (max-width: 640px) {
  .nav {
    gap: 16px;
  }

  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
