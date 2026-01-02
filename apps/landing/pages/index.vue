<script setup lang="ts">
import { ref } from 'vue'

// Page meta
useHead({
  title: 'Boardkit — The offline-first modular whiteboard',
  meta: [
    { name: 'description', content: 'An infinite canvas with productivity widgets that works 100% offline. Your data stays on your device.' },
    { name: 'theme-color', content: '#171717' },
  ],
})

// FAQ state
const openFaqIndex = ref(0)

function toggleFaq(index: number) {
  openFaqIndex.value = openFaqIndex.value === index ? -1 : index
}

const faqs = [
  {
    question: 'Is Boardkit really free?',
    answer: 'Yes! For personal and non-commercial use, Boardkit is completely free with all features. Commercial use (companies with 2+ people) requires a license at 50€/user/year.',
  },
  {
    question: 'Where is my data stored?',
    answer: '100% on your device. On the web, we use IndexedDB. On desktop, files are in your filesystem. We have no servers, no cloud, no access to your data.',
  },
  {
    question: 'Can I sync between devices?',
    answer: 'You can export .boardkit files and sync via Dropbox, Google Drive, or Git. We\'re building Boardkit Sync (optional, paid) for seamless sync with end-to-end encryption.',
  },
  {
    question: 'Is it open source?',
    answer: 'Yes! Licensed under AGPL-3.0. View, fork, and contribute on GitHub. Commercial use requires a separate license.',
  },
  {
    question: 'What about collaboration?',
    answer: 'Boardkit is designed for personal productivity, not real-time collaboration. This keeps it simple, fast, and truly offline.',
  },
  {
    question: 'What platforms are supported?',
    answer: 'Web (any modern browser), macOS (native via Tauri). Windows and Linux coming soon.',
  },
]

const modules = [
  { name: 'Todo', desc: 'Tasks & checklists' },
  { name: 'Timer', desc: 'Pomodoro focus timer' },
  { name: 'Kanban', desc: 'Drag & drop boards' },
  { name: 'Stats Card', desc: 'Cross-widget metrics' },
  { name: 'Text', desc: 'Rich Markdown notes' },
  { name: 'Focus Lens', desc: 'Single task focus mode' },
  { name: 'Habit Tracker', desc: 'Streak tracking' },
  { name: 'Counter', desc: 'Customizable counter' },
  { name: 'Scratchpad', desc: 'Quick notes' },
  { name: 'Task Radar', desc: 'Task aggregation' },
  { name: 'Calendar', desc: 'Google Calendar integration' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <div class="hero">
      <div class="hero-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
      <div class="hero-content">
        <h1 class="cursive">Boardkit</h1>
        <p class="hero-tagline">The offline-first modular whiteboard</p>
        <p class="hero-description">
          Your data stays on your device. No cloud required. No vendor lock-in.
          An infinite canvas with productivity widgets that truly belongs to you.
        </p>
        <div class="hero-buttons">
          <a href="https://app.boardkit.sh" class="btn">Try Online</a>
          <a href="https://github.com/kevinbarfleur/boardkit/releases" class="btn">Download macOS</a>
          <a href="https://github.com/kevinbarfleur/boardkit" class="btn">GitHub</a>
        </div>
      </div>
    </div>

    <!-- What it does -->
    <section id="features">
      <h2 class="cursive">What it does</h2>
      <ul>
        <li><strong>Infinite canvas</strong> — Draw, sketch, and organize freely with shapes, arrows, and text</li>
        <li><strong>11 built-in modules</strong> — Todo, Timer, Kanban, Habits, Stats, and more</li>
        <li><strong>100% offline</strong> — No account, no cloud, no tracking. Works in airplane mode</li>
        <li><strong>Cross-module data sharing</strong> — Widgets talk to each other through versioned contracts</li>
        <li><strong>Your data, your device</strong> — Export anytime, no lock-in ever</li>
      </ul>
    </section>

    <!-- Modules -->
    <section>
      <h2 class="cursive">Built-in modules</h2>
      <ul class="modules-list">
        <li v-for="mod in modules" :key="mod.name">
          <a href="#"><strong>{{ mod.name }}</strong></a>
          <span> — {{ mod.desc }}</span>
        </li>
      </ul>
    </section>

    <!-- Modules Mosaic -->
    <section class="mosaic-section">
      <div class="mosaic">
        <!-- Todo -->
        <div class="mosaic-card" style="--rotation: -2deg; --offset-y: 0px;">
          <div class="mosaic-preview">
            <div class="mosaic-window">
              <div class="window-dots"><span /><span /><span /></div>
              <div class="window-content">
                <div class="fake-todo">
                  <div class="fake-check checked" />
                  <div class="fake-line" style="width: 70%" />
                </div>
                <div class="fake-todo">
                  <div class="fake-check checked" />
                  <div class="fake-line" style="width: 55%" />
                </div>
                <div class="fake-todo">
                  <div class="fake-check" />
                  <div class="fake-line" style="width: 80%" />
                </div>
                <div class="fake-todo">
                  <div class="fake-check" />
                  <div class="fake-line" style="width: 45%" />
                </div>
              </div>
            </div>
          </div>
          <span class="mosaic-label">Todo</span>
        </div>

        <!-- Timer -->
        <div class="mosaic-card" style="--rotation: 1.5deg; --offset-y: 12px;">
          <div class="mosaic-preview">
            <div class="mosaic-window">
              <div class="window-dots"><span /><span /><span /></div>
              <div class="window-content timer-content">
                <div class="fake-timer">25:00</div>
                <div class="fake-timer-bar" />
              </div>
            </div>
          </div>
          <span class="mosaic-label">Timer</span>
        </div>

        <!-- Kanban -->
        <div class="mosaic-card" style="--rotation: -1deg; --offset-y: -8px;">
          <div class="mosaic-preview">
            <div class="mosaic-window">
              <div class="window-dots"><span /><span /><span /></div>
              <div class="window-content kanban-content">
                <div class="fake-column">
                  <div class="fake-card" />
                  <div class="fake-card" />
                </div>
                <div class="fake-column">
                  <div class="fake-card" />
                </div>
                <div class="fake-column">
                  <div class="fake-card" />
                  <div class="fake-card" />
                  <div class="fake-card" />
                </div>
              </div>
            </div>
          </div>
          <span class="mosaic-label">Kanban</span>
        </div>

        <!-- Stats -->
        <div class="mosaic-card" style="--rotation: 2deg; --offset-y: 20px;">
          <div class="mosaic-preview">
            <div class="mosaic-window">
              <div class="window-dots"><span /><span /><span /></div>
              <div class="window-content stats-content">
                <div class="fake-stat-number">42</div>
                <div class="fake-stat-label" />
                <div class="fake-stat-bar">
                  <div class="fake-stat-fill" style="width: 68%" />
                </div>
              </div>
            </div>
          </div>
          <span class="mosaic-label">Stats</span>
        </div>

        <!-- Habits -->
        <div class="mosaic-card" style="--rotation: -1.5deg; --offset-y: 5px;">
          <div class="mosaic-preview">
            <div class="mosaic-window">
              <div class="window-dots"><span /><span /><span /></div>
              <div class="window-content habit-content">
                <div class="fake-habit-grid">
                  <span class="filled" /><span class="filled" /><span class="filled" /><span /><span class="filled" /><span class="filled" /><span />
                  <span class="filled" /><span /><span class="filled" /><span class="filled" /><span class="filled" /><span class="filled" /><span class="filled" />
                  <span class="filled" /><span class="filled" /><span /><span class="filled" /><span class="filled" /><span /><span class="today" />
                </div>
              </div>
            </div>
          </div>
          <span class="mosaic-label">Habits</span>
        </div>

        <!-- Text -->
        <div class="mosaic-card" style="--rotation: 1deg; --offset-y: -5px;">
          <div class="mosaic-preview">
            <div class="mosaic-window">
              <div class="window-dots"><span /><span /><span /></div>
              <div class="window-content text-content">
                <div class="fake-text-line" style="width: 90%" />
                <div class="fake-text-line" style="width: 75%" />
                <div class="fake-text-line" style="width: 85%" />
                <div class="fake-text-line" style="width: 40%" />
              </div>
            </div>
          </div>
          <span class="mosaic-label">Text</span>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section>
      <h2 class="cursive">How it works</h2>
      <ol class="steps">
        <li><strong>Download or open online</strong> — Get the macOS app or use the web version. No account needed.</li>
        <li><strong>Create your board</strong> — Start blank. Drop widgets, draw shapes, organize your way.</li>
        <li><strong>Own your data</strong> — Everything stays on your device. Export anytime.</li>
      </ol>
    </section>

    <!-- Pricing -->
    <section id="pricing">
      <h2 class="cursive">Pricing</h2>

      <div class="pricing-item">
        <h3>Personal <span class="cursive">— free forever</span></h3>
        <p>For individuals and personal use.</p>
        <ul>
          <li>All features included</li>
          <li>Unlimited boards</li>
          <li>Desktop + Web</li>
          <li>Community support</li>
        </ul>
        <a href="https://github.com/kevinbarfleur/boardkit/releases" class="btn">Download Free</a>
      </div>

      <div class="pricing-item">
        <h3>Commercial <span class="cursive">— 50€/user/year</span></h3>
        <p>For companies and professional use (2+ people).</p>
        <ul>
          <li>All features included</li>
          <li>Priority support</li>
          <li>Invoice for taxes</li>
          <li>Legal compliance</li>
        </ul>
        <a href="mailto:hello@boardkit.sh" class="btn">Buy License</a>
      </div>

      <div class="pricing-item">
        <h3>Supporter <span class="cursive">— 25€+ one-time</span></h3>
        <p>Love what we're building? Support development with a donation. Get a badge on Discord and early access to betas.</p>
        <a href="https://github.com/sponsors/kevinbarfleur" class="btn">Become a Supporter</a>
      </div>
    </section>

    <!-- FAQ -->
    <section>
      <h2 class="cursive">Questions</h2>

      <div
        v-for="(faq, index) in faqs"
        :key="index"
        class="faq-item"
        :class="{ open: openFaqIndex === index }"
      >
        <button class="faq-question" @click="toggleFaq(index)">
          {{ faq.question }}
          <span class="faq-icon">+</span>
        </button>
        <div class="faq-answer">
          <p>{{ faq.answer }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <div class="cta">
      <h2 class="cursive">Ready to own your whiteboard?</h2>
      <p>No account. No cloud. Just you.</p>
      <div class="hero-buttons">
        <a href="https://app.boardkit.sh" class="btn">Try Online</a>
        <a href="https://github.com/kevinbarfleur/boardkit/releases" class="btn">Download macOS</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Typography */
.cursive {
  font-family: 'Caveat', cursive;
}

/* Links */
a {
  color: hsl(var(--foreground));
  text-decoration: underline;
  text-underline-offset: 3px;
}

a:hover {
  text-decoration-color: hsl(var(--muted-foreground));
}

/* Hero */
.hero {
  padding: 80px 0 60px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.hero-icon {
  width: 80px;
  height: 80px;
  background: #262626;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-icon svg {
  width: 36px;
  height: 36px;
  stroke: hsl(var(--foreground));
}

.hero-content h1 {
  font-size: 42px;
  font-weight: 600;
  line-height: 1.1;
  margin-bottom: 4px;
  font-style: italic;
}

.hero-tagline {
  font-size: 16px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 16px;
}

.hero-description {
  font-size: 15px;
  color: hsl(var(--muted-foreground));
  font-style: italic;
  margin-bottom: 20px;
}

.hero-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 8px 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 14px;
  color: hsl(var(--foreground));
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;
}

.btn:hover {
  border-color: hsl(var(--muted-foreground));
  background: rgba(255, 255, 255, 0.03);
  text-decoration: none;
}

/* Sections */
section {
  padding: 48px 0;
}

section h2 {
  font-size: 32px;
  font-weight: 500;
  margin-bottom: 20px;
}

section ul {
  list-style: disc;
  padding-left: 20px;
}

section li {
  padding: 6px 0;
  color: hsl(var(--muted-foreground));
  font-size: 15px;
}

section li strong {
  color: hsl(var(--foreground));
}

section li a {
  color: hsl(var(--foreground));
}

/* Modules list */
.modules-list {
  list-style: disc;
  padding-left: 20px;
}

.modules-list li {
  padding: 4px 0;
}

.modules-list span {
  color: hsl(var(--muted-foreground));
}

/* Steps */
.steps {
  list-style: none;
  padding-left: 0;
  counter-reset: step;
}

.steps li {
  padding: 8px 0;
  padding-left: 36px;
  position: relative;
}

.steps li::before {
  content: counter(step);
  counter-increment: step;
  position: absolute;
  left: 0;
  font-family: 'Caveat', cursive;
  font-size: 24px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.steps strong {
  color: hsl(var(--foreground));
}

/* Pricing */
.pricing-item {
  margin-bottom: 32px;
}

.pricing-item h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pricing-item h3 .cursive {
  font-size: 22px;
  color: hsl(var(--muted-foreground));
  font-weight: 400;
}

.pricing-item > p {
  color: hsl(var(--muted-foreground));
  font-size: 15px;
  margin-bottom: 8px;
}

.pricing-item ul {
  margin-bottom: 12px;
}

/* FAQ */
.faq-item {
  border-bottom: 1px solid hsl(var(--border));
  padding: 16px 0;
}

.faq-item:first-child {
  border-top: 1px solid hsl(var(--border));
}

.faq-question {
  width: 100%;
  background: none;
  border: none;
  color: hsl(var(--foreground));
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-question:hover {
  color: hsl(var(--muted-foreground));
}

.faq-icon {
  font-size: 18px;
  color: hsl(var(--muted-foreground));
  transition: transform 0.2s;
}

.faq-item.open .faq-icon {
  transform: rotate(45deg);
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.2s ease;
}

.faq-item.open .faq-answer {
  max-height: 300px;
}

.faq-answer p {
  padding-top: 12px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  line-height: 1.7;
}

/* CTA */
.cta {
  padding: 48px 0 80px;
  text-align: center;
}

.cta h2 {
  font-size: 28px;
  margin-bottom: 8px;
}

.cta p {
  color: hsl(var(--muted-foreground));
  margin-bottom: 20px;
  font-size: 15px;
}

.cta .hero-buttons {
  justify-content: center;
}

/* Mosaic */
.mosaic-section {
  padding: 24px 0 48px;
}

.mosaic {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  max-width: 580px;
  margin: 0 auto;
}

.mosaic-card {
  transform: rotate(var(--rotation, 0deg)) translateY(var(--offset-y, 0px));
  transition: transform 0.2s ease;
}

.mosaic-card:hover {
  transform: rotate(0deg) translateY(-4px) scale(1.02);
  z-index: 10;
}

.mosaic-preview {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px hsl(var(--border));
}

.mosaic-window {
  width: 150px;
  height: 100px;
  background: #0d0d0d;
  border-radius: 6px;
  overflow: hidden;
}

.window-dots {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: #1a1a1a;
}

.window-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #333;
}

.window-content {
  padding: 8px;
  height: calc(100% - 24px);
}

.mosaic-label {
  display: block;
  text-align: center;
  font-family: 'Caveat', cursive;
  font-size: 18px;
  color: hsl(var(--muted-foreground));
  margin-top: 8px;
}

/* Fake Todo */
.fake-todo {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.fake-check {
  width: 8px;
  height: 8px;
  border: 1px solid #444;
  border-radius: 2px;
}

.fake-check.checked {
  background: hsl(var(--foreground));
  border-color: hsl(var(--foreground));
}

.fake-line {
  height: 6px;
  background: #2a2a2a;
  border-radius: 2px;
}

/* Fake Timer */
.timer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.fake-timer {
  font-family: ui-monospace, monospace;
  font-size: 22px;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 8px;
}

.fake-timer-bar {
  width: 80%;
  height: 4px;
  background: #2a2a2a;
  border-radius: 2px;
  position: relative;
}

.fake-timer-bar::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 65%;
  height: 100%;
  background: hsl(var(--foreground));
  border-radius: 2px;
}

/* Fake Kanban */
.kanban-content {
  display: flex;
  gap: 6px;
}

.fake-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fake-card {
  height: 14px;
  background: #2a2a2a;
  border-radius: 2px;
}

/* Fake Stats */
.stats-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.fake-stat-number {
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  line-height: 1;
}

.fake-stat-label {
  width: 50px;
  height: 6px;
  background: #2a2a2a;
  border-radius: 2px;
  margin: 6px 0;
}

.fake-stat-bar {
  width: 90%;
  height: 6px;
  background: #2a2a2a;
  border-radius: 3px;
}

.fake-stat-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 3px;
}

/* Fake Habit */
.habit-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.fake-habit-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.fake-habit-grid span {
  width: 8px;
  height: 8px;
  background: #2a2a2a;
  border-radius: 2px;
}

.fake-habit-grid span.filled {
  background: #22c55e;
}

.fake-habit-grid span.today {
  background: hsl(var(--foreground));
}

/* Fake Text */
.text-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.fake-text-line {
  height: 6px;
  background: #2a2a2a;
  border-radius: 2px;
}

/* Responsive */
@media (max-width: 640px) {
  .hero {
    flex-direction: column;
    padding: 60px 0 40px;
  }

  .hero-icon {
    width: 64px;
    height: 64px;
  }

  .hero-content h1 {
    font-size: 32px;
  }

  .mosaic {
    gap: 16px;
  }

  .mosaic-window {
    width: 130px;
    height: 90px;
  }
}
</style>
