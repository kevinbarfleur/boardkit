<script setup lang="ts">
// Page meta
useHead({
  title: 'Boardkit - The whiteboard that truly belongs to you',
  meta: [
    { name: 'description', content: 'An infinite canvas with productivity widgets that works 100% offline. Your data stays on your device. No cloud, no account, no tracking.' },
  ],
})
</script>

<template>
  <div>
    <!-- Hero with Demo Placeholder -->
    <HeroSection />

    <!-- Features Grid -->
    <FeaturesGrid />

    <!-- Code Showcase (Developer Experience) -->
    <CodeShowcase />

    <!-- Modules Grid -->
    <ModulesGrid />

    <!-- How it Works -->
    <HowItWorks />

    <!-- Pricing -->
    <PricingSection />

    <!-- FAQ -->
    <FaqSection />

    <!-- Final CTA -->
    <FinalCta />
  </div>
</template>
