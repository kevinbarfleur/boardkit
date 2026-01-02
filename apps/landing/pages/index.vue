<script setup lang="ts">
// Waitlist form state
const email = ref('')
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const errorMessage = ref('')

const submitWaitlist = async () => {
  if (!email.value || !email.value.includes('@')) {
    errorMessage.value = 'Please enter a valid email'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  // For now, just simulate success - you'll connect this to your backend later
  // Options: Buttondown, ConvertKit, Mailchimp, or simple Google Form
  await new Promise(resolve => setTimeout(resolve, 800))

  isSubmitted.value = true
  isSubmitting.value = false
}

// Features data
const features = [
  {
    icon: 'i-lucide-palette',
    title: 'Infinite Canvas',
    description: 'Draw, sketch, and organize freely on an endless workspace. Native shapes, arrows, freehand drawing, and text — all the tools you need.',
  },
  {
    icon: 'i-lucide-boxes',
    title: '11 Built-in Modules',
    description: 'Todo lists, Pomodoro timer, Kanban boards, habit tracker, and more. Productivity widgets that actually work together.',
  },
  {
    icon: 'i-lucide-wifi-off',
    title: '100% Offline',
    description: 'Your data stays on your device. No account required, no cloud dependency, no tracking. Works perfectly in airplane mode.',
  },
  {
    icon: 'i-lucide-share-2',
    title: 'Cross-Module Data',
    description: 'Widgets talk to each other through versioned contracts. Your Stats card can pull data from Todos, Timer, and Habits. Unique to Boardkit.',
  },
]

// Modules data
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

// FAQ data - adjusted for pre-launch
const faqs = [
  {
    question: 'Is Boardkit really free?',
    answer: 'Yes! For personal and non-commercial use, Boardkit will be completely free with all features included. We believe everyone should have access to great tools. Commercial use (companies with 2+ people) will require a license at 50€/user/year.',
  },
  {
    question: 'Where will my data be stored?',
    answer: '100% on your device. On the web, we use IndexedDB (your browser\'s local storage). On desktop, files are stored in your filesystem as .boardkit files. We have no servers, no cloud, no access to your data whatsoever.',
  },
  {
    question: 'Can I sync between devices?',
    answer: 'At launch, you\'ll be able to export .boardkit files and sync them manually via Dropbox, Google Drive, iCloud, or Git. We\'re planning Boardkit Sync (optional, paid) for seamless device sync with end-to-end encryption.',
  },
  {
    question: 'Is it open source?',
    answer: 'Yes! Boardkit will be licensed under AGPL-3.0. You\'ll be able to view, fork, and contribute to the code on GitHub. The license ensures that improvements stay open. Commercial use requires a separate license.',
  },
  {
    question: 'What about real-time collaboration?',
    answer: 'Boardkit is intentionally designed for personal productivity, not real-time collaboration. This keeps the tool simple, fast, and truly offline. Share your .boardkit files for async collaboration.',
  },
  {
    question: 'What platforms will be supported?',
    answer: 'Web (any modern browser) and macOS (native app via Tauri) at launch. The web version will work offline as a PWA. Windows and Linux desktop apps will follow.',
  },
]

// FAQ open state
const openFaq = ref<number | null>(null)

const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index
}

// Stats
const stats = [
  { value: '11', label: 'Modules' },
  { value: '100%', label: 'Offline' },
  { value: 'Open', label: 'Source' },
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative pt-32 pb-16 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
      <div class="container-landing">
        <div class="max-w-4xl mx-auto text-center">
          <!-- Badge -->
          <div
            class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8 animate-fade-in-down"
          >
            <span class="i-lucide-rocket text-sm" />
            <span>Coming soon — Join the waitlist</span>
          </div>

          <!-- Headline -->
          <h1 class="heading-1 mb-6 animate-fade-in-up">
            The whiteboard that
            <span class="gradient-text-primary">truly belongs</span>
            to you
          </h1>

          <!-- Subheadline -->
          <p class="body-large max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-1">
            An infinite canvas with productivity widgets that works 100% offline.
            Your data stays on your device. No cloud, no account, no tracking.
          </p>

          <!-- Waitlist Form -->
          <div class="max-w-md mx-auto mb-16 animate-fade-in-up stagger-2">
            <div v-if="!isSubmitted" class="flex flex-col sm:flex-row gap-3">
              <input
                v-model="email"
                type="email"
                placeholder="you@email.com"
                class="flex-1 h-12 px-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                :disabled="isSubmitting"
                @keyup.enter="submitWaitlist"
              />
              <button
                class="btn-primary h-12 px-6 sm:w-auto"
                :disabled="isSubmitting"
                @click="submitWaitlist"
              >
                <span v-if="isSubmitting" class="i-lucide-loader-2 animate-spin" />
                <span v-else class="i-lucide-mail" />
                {{ isSubmitting ? 'Joining...' : 'Get Early Access' }}
              </button>
            </div>
            <div v-else class="flex items-center justify-center gap-3 h-12 px-6 rounded-xl bg-success/10 border border-success/20 text-success">
              <span class="i-lucide-check-circle" />
              <span>You're on the list! We'll be in touch soon.</span>
            </div>
            <p v-if="errorMessage" class="text-destructive text-sm mt-2">{{ errorMessage }}</p>
            <p class="text-muted-foreground text-sm mt-4">
              Be the first to know when we launch. No spam, unsubscribe anytime.
            </p>
          </div>

          <!-- Hero Screenshot -->
          <div class="relative animate-scale-in stagger-3">
            <!-- Glow effect -->
            <div class="absolute -inset-4 bg-primary/20 rounded-3xl blur-3xl opacity-50" />

            <!-- Screenshot container -->
            <div class="relative rounded-xl border border-border overflow-hidden shadow-hero bg-card">
              <!-- Fake window chrome -->
              <div class="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div class="flex gap-2">
                  <div class="w-3 h-3 rounded-full bg-destructive/80" />
                  <div class="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div class="w-3 h-3 rounded-full bg-success/80" />
                </div>
                <div class="flex-1 flex justify-center">
                  <div class="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
                    boardkit.sh
                  </div>
                </div>
                <div class="w-16" />
              </div>

              <!-- Screenshot placeholder -->
              <div class="aspect-[16/10] bg-background flex items-center justify-center">
                <div class="text-center p-8">
                  <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span class="i-lucide-sparkles text-primary text-4xl" />
                  </div>
                  <p class="text-muted-foreground text-lg">
                    Screenshot coming soon
                  </p>
                  <p class="text-muted-foreground/60 text-sm mt-2">
                    Canvas + Widgets + Native drawing tools
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-12 border-y border-border bg-card/50">
      <div class="container-landing">
        <div class="flex flex-wrap justify-center gap-12 md:gap-20">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="text-center"
          >
            <div class="text-3xl md:text-4xl font-bold text-foreground mb-1">
              {{ stat.value }}
            </div>
            <div class="text-sm text-muted-foreground">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="section-padding">
      <div class="container-landing">
        <!-- Section header -->
        <div class="text-center max-w-2xl mx-auto mb-16">
          <h2 class="heading-2 mb-4">
            Everything you need, nothing you don't
          </h2>
          <p class="body-large">
            A focused toolkit for visual thinking and personal productivity.
            No bloat, no complexity, no vendor lock-in.
          </p>
        </div>

        <!-- Features grid -->
        <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="card-interactive p-6 lg:p-8"
          >
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span :class="feature.icon" class="text-primary text-xl" />
              </div>
              <div>
                <h3 class="heading-3 mb-2">{{ feature.title }}</h3>
                <p class="body">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Modules Section -->
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

    <!-- How it works -->
    <section class="section-padding">
      <div class="container-landing">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <h2 class="heading-2 mb-4">
            Simple by design
          </h2>
          <p class="body-large">
            No accounts, no setup wizards, no onboarding flows.
            Just open and start creating.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span class="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 class="font-semibold text-foreground mb-2">Open</h3>
            <p class="body-small">
              Launch the app or visit the website. No sign-up required.
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span class="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 class="font-semibold text-foreground mb-2">Create</h3>
            <p class="body-small">
              Draw on the canvas, add widgets, organize your thoughts.
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span class="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 class="font-semibold text-foreground mb-2">Own</h3>
            <p class="body-small">
              Your data is saved locally. Export as .boardkit files anytime.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="section-padding bg-card/50 border-y border-border">
      <div class="container-landing">
        <!-- Section header -->
        <div class="text-center max-w-2xl mx-auto mb-16">
          <h2 class="heading-2 mb-4">
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
          <div class="card-base p-8">
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
              <li class="flex items-start gap-3">
                <span class="i-lucide-check text-success mt-0.5 shrink-0" />
                <span class="body-small text-foreground">All features included</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="i-lucide-check text-success mt-0.5 shrink-0" />
                <span class="body-small text-foreground">Unlimited boards</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="i-lucide-check text-success mt-0.5 shrink-0" />
                <span class="body-small text-foreground">Desktop + Web apps</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="i-lucide-check text-success mt-0.5 shrink-0" />
                <span class="body-small text-foreground">Community support</span>
              </li>
            </ul>

            <button
              class="btn-outline btn-md w-full"
              @click="document.querySelector('input[type=email]')?.focus()"
            >
              <span class="i-lucide-mail text-sm" />
              Join Waitlist
            </button>
          </div>

          <!-- Commercial -->
          <div class="card-base p-8 border-2 border-primary relative">
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
              <li class="flex items-start gap-3">
                <span class="i-lucide-check text-success mt-0.5 shrink-0" />
                <span class="body-small text-foreground">Everything in Personal</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="i-lucide-check text-success mt-0.5 shrink-0" />
                <span class="body-small text-foreground">Priority email support</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="i-lucide-check text-success mt-0.5 shrink-0" />
                <span class="body-small text-foreground">Invoice for accounting</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="i-lucide-check text-success mt-0.5 shrink-0" />
                <span class="body-small text-foreground">Legal compliance</span>
              </li>
            </ul>

            <button
              class="btn-primary btn-md w-full opacity-70 cursor-not-allowed"
              disabled
            >
              <span class="i-lucide-clock text-sm" />
              Available at launch
            </button>
          </div>
        </div>

        <!-- Supporter note -->
        <div class="mt-12 max-w-2xl mx-auto">
          <div class="card-base p-6 border-dashed text-center">
            <div class="flex items-center justify-center gap-2 mb-3">
              <span class="i-lucide-heart text-primary" />
              <h3 class="font-medium text-foreground">Want to support the project?</h3>
            </div>
            <p class="body-small">
              Boardkit is built with care by an indie developer. If you believe in offline-first,
              privacy-respecting tools, joining the waitlist is the best way to support us right now.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="section-padding">
      <div class="container-landing">
        <!-- Section header -->
        <div class="text-center max-w-2xl mx-auto mb-16">
          <h2 class="heading-2 mb-4">
            Frequently asked questions
          </h2>
          <p class="body-large">
            Everything you need to know about Boardkit.
          </p>
        </div>

        <!-- FAQ list -->
        <div class="max-w-2xl mx-auto space-y-4">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="card-base overflow-hidden"
          >
            <button
              class="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-accent/50 transition-colors"
              @click="toggleFaq(index)"
            >
              <span class="font-medium text-foreground">{{ faq.question }}</span>
              <span
                :class="openFaq === index ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                class="text-muted-foreground shrink-0 transition-transform"
              />
            </button>
            <div
              v-show="openFaq === index"
              class="px-6 pb-4"
            >
              <p class="body-small text-muted-foreground">
                {{ faq.answer }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="section-padding bg-card/50 border-t border-border">
      <div class="container-landing">
        <div class="text-center max-w-2xl mx-auto">
          <h2 class="heading-2 mb-4">
            Ready to own your whiteboard?
          </h2>
          <p class="body-large mb-8">
            No account. No cloud. Just you and your ideas.
          </p>
          <button
            class="btn-primary btn-lg"
            @click="document.querySelector('input[type=email]')?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' })"
          >
            <span class="i-lucide-mail" />
            Join the Waitlist
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
