<script setup lang="ts">
const personalFeatures = [
  'All features included',
  'Unlimited boards',
  'Desktop + Web apps',
  'Community support',
]

const commercialFeatures = [
  'Everything in Personal',
  'Priority email support',
  'Invoice for accounting',
  'Legal compliance',
]
</script>

<template>
  <section id="pricing" class="section-padding bg-card/50 border-y border-border">
    <div class="container-landing">
      <!-- Section header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="heading-2 font-serif mb-4">
          Simple, fair pricing
        </h2>
        <p class="body-large">
          Free for personal use. One simple license for commercial use.
          No tiers, no tricks, no surprises.
        </p>
      </div>

      <!-- Pricing cards -->
      <div class="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
        <!-- Personal -->
        <div class="card-base p-8 group hover:border-primary/30 transition-colors">
          <div class="mb-6">
            <h3 class="text-lg font-medium text-muted-foreground mb-2">Personal</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-5xl font-bold text-foreground">Free</span>
            </div>
            <p class="text-sm text-muted-foreground mt-2">
              For individuals and non-commercial use
            </p>
          </div>

          <ul class="space-y-4 mb-8">
            <li
              v-for="feature in personalFeatures"
              :key="feature"
              class="flex items-start gap-3"
            >
              <span class="i-lucide-check text-success mt-0.5 shrink-0" />
              <span class="body-small text-foreground">{{ feature }}</span>
            </li>
          </ul>

          <a
            href="https://github.com/kevinbarfleur/boardkit/releases"
            class="btn-outline btn-md w-full"
          >
            Download Free
          </a>
        </div>

        <!-- Commercial -->
        <div class="card-base p-8 border-2 border-primary relative group">
          <!-- Badge -->
          <div class="absolute -top-3 left-1/2 -translate-x-1/2">
            <span class="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              For teams
            </span>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-medium text-muted-foreground mb-2">Commercial</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-5xl font-bold text-foreground">50€</span>
              <span class="text-muted-foreground">/user/year</span>
            </div>
            <p class="text-sm text-muted-foreground mt-2">
              For companies and commercial use
            </p>
          </div>

          <ul class="space-y-4 mb-8">
            <li
              v-for="feature in commercialFeatures"
              :key="feature"
              class="flex items-start gap-3"
            >
              <span class="i-lucide-check text-success mt-0.5 shrink-0" />
              <span class="body-small text-foreground">{{ feature }}</span>
            </li>
          </ul>

          <a
            href="#"
            class="btn-primary btn-md w-full"
          >
            Buy License
          </a>
        </div>
      </div>

      <!-- Supporter note -->
      <div class="mt-12 max-w-2xl mx-auto">
        <div class="card-base p-6 border-dashed text-center group hover:border-primary/30 transition-colors">
          <div class="flex items-center justify-center gap-2 mb-3">
            <span class="i-lucide-heart text-primary" />
            <h3 class="font-medium text-foreground">Support the project</h3>
          </div>
          <p class="body-small mb-4">
            Love what we're building? Support development with a one-time donation.
            Get a badge, early access to betas, and our eternal gratitude.
          </p>
          <a
            href="https://github.com/sponsors/kevinbarfleur"
            target="_blank"
            rel="noopener"
            class="btn-ghost btn-sm"
          >
            Become a Supporter
            <span class="i-lucide-arrow-right text-sm" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
