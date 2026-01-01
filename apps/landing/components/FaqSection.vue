<script setup lang="ts">
const faqs = [
  {
    question: 'Is Boardkit really free?',
    answer: 'Yes! For personal and non-commercial use, Boardkit is completely free with all features included. We believe everyone should have access to great tools. Commercial use (companies with 2+ people) requires a license at 50€/user/year.',
  },
  {
    question: 'Where is my data stored?',
    answer: '100% on your device. On the web, we use IndexedDB (your browser\'s local storage). On desktop, files are stored in your filesystem as .boardkit files. We have no servers, no cloud, no access to your data whatsoever.',
  },
  {
    question: 'Can I sync between devices?',
    answer: 'Currently, you can export .boardkit files and sync them manually via Dropbox, Google Drive, iCloud, or Git. We\'re building Boardkit Sync (optional, paid) for seamless device sync with end-to-end encryption.',
  },
  {
    question: 'Is it open source?',
    answer: 'Yes! Boardkit is licensed under AGPL-3.0. You can view, fork, and contribute to the code on GitHub. The license ensures that improvements stay open. Commercial use requires a separate license.',
  },
  {
    question: 'What about real-time collaboration?',
    answer: 'Boardkit is intentionally designed for personal productivity, not real-time collaboration. This keeps the tool simple, fast, and truly offline. Share your .boardkit files for async collaboration.',
  },
  {
    question: 'What platforms are supported?',
    answer: 'Web (any modern browser) and macOS (native app via Tauri). The web version works offline as a PWA. Windows and Linux desktop apps are coming soon.',
  },
]

const openFaq = ref<number | null>(null)

const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index
}
</script>

<template>
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
          class="card-base overflow-hidden transition-colors"
          :class="{ 'border-primary/30': openFaq === index }"
        >
          <button
            class="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-accent/50 transition-colors"
            @click="toggleFaq(index)"
          >
            <span class="font-medium text-foreground">{{ faq.question }}</span>
            <span
              class="text-muted-foreground shrink-0 transition-transform duration-200"
              :class="[
                openFaq === index ? 'i-lucide-chevron-down rotate-180' : 'i-lucide-chevron-down'
              ]"
            />
          </button>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-96"
            leave-from-class="opacity-100 max-h-96"
            leave-to-class="opacity-0 max-h-0"
          >
            <div
              v-show="openFaq === index"
              class="overflow-hidden"
            >
              <div class="px-6 pb-4">
                <p class="body-small text-muted-foreground">
                  {{ faq.answer }}
                </p>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>
