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

// Core modules (built-in, ship with the app)
const coreModules = [
  { name: 'Todo', desc: 'Tasks & checklists', icon: 'check-square' },
  { name: 'Timer', desc: 'Pomodoro focus timer', icon: 'timer' },
  { name: 'Kanban', desc: 'Drag & drop boards', icon: 'columns' },
  { name: 'Text', desc: 'Rich Markdown notes', icon: 'file-text' },
  { name: 'Counter', desc: 'Customizable counter', icon: 'hash' },
  { name: 'Scratchpad', desc: 'Quick notes', icon: 'edit-3' },
]

// Official plugins (installable, external packages)
const plugins = [
  { name: 'Stats Card', desc: 'Cross-widget metrics', icon: 'bar-chart-2' },
  { name: 'Focus Lens', desc: 'Single task focus mode', icon: 'target' },
  { name: 'Habit Tracker', desc: 'Streak tracking', icon: 'calendar-check' },
  { name: 'Task Radar', desc: 'Task aggregation', icon: 'radar' },
  { name: 'Google Calendar', desc: 'Calendar integration', icon: 'calendar' },
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
        <h1 class="serif-heading">Boardkit</h1>
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
      <h2 class="serif-heading">What it does</h2>
      <ul>
        <li><strong>Infinite canvas</strong> — Draw, sketch, and organize freely with shapes, arrows, and text</li>
        <li><strong>6 core modules + official plugins</strong> — Todo, Timer, Kanban, Text, and more. Extend with plugins</li>
        <li><strong>100% offline</strong> — No account, no cloud, no tracking. Works in airplane mode</li>
        <li><strong>Cross-module data sharing</strong> — Widgets talk to each other through versioned contracts</li>
        <li><strong>Your data, your device</strong> — Export anytime, no lock-in ever</li>
      </ul>
    </section>

    <!-- Core Modules -->
    <section>
      <h2 class="serif-heading">Core modules</h2>
      <p class="section-subtitle">Built-in, ship with every installation</p>
      <ul class="modules-list">
        <li v-for="mod in coreModules" :key="mod.name">
          <a href="#"><strong>{{ mod.name }}</strong></a>
          <span> — {{ mod.desc }}</span>
        </li>
      </ul>
    </section>

    <!-- Plugins -->
    <section class="plugins-section">
      <h2 class="serif-heading">Official plugins</h2>
      <p class="section-subtitle">Extend Boardkit with additional functionality</p>
      <ul class="modules-list">
        <li v-for="plugin in plugins" :key="plugin.name">
          <a href="#"><strong>{{ plugin.name }}</strong></a>
          <span> — {{ plugin.desc }}</span>
        </li>
      </ul>

      <!-- Plugin Code Examples -->
      <div class="code-examples">
        <h3 class="code-title serif-heading">Build your own plugin</h3>
        <p class="code-subtitle">Plugins are simple TypeScript modules with a clear API</p>

        <div class="code-block">
          <div class="code-header">
            <span class="code-filename">manifest.json</span>
          </div>
          <pre class="code-content"><code>{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "author": "You",
  "description": "A custom widget for Boardkit",
  "icon": "star",
  "provides": ["my-plugin.data.v1"],
  "consumes": []
}</code></pre>
        </div>

        <div class="code-block">
          <div class="code-header">
            <span class="code-filename">src/index.ts</span>
          </div>
          <pre class="code-content"><code>import { definePlugin } from '@boardkit/plugin-api'
import MyWidget from './MyWidget.vue'

export default definePlugin({
  pluginId: 'my-plugin',
  displayName: 'My Plugin',
  icon: 'star',
  component: MyWidget,

  defaultState: () => ({
    title: 'My Widget',
    items: [],
  }),

  minWidth: 200,
  minHeight: 150,

  settingsSchema: {
    sections: [{
      id: 'display',
      title: 'Display',
      fields: [{
        key: 'showHeader',
        type: 'toggle',
        label: 'Show header',
      }]
    }]
  }
})</code></pre>
        </div>
      </div>
    </section>

    <!-- Modules Mosaic - Cloud arrangement -->
    <section class="mosaic-section">
      <div class="mosaic-cloud">
        <!-- Row 1: Todo + Timer -->
        <div class="mosaic-row">
          <div class="mosaic-card" style="--rotation: -3deg;">
            <div class="mosaic-preview">
              <div class="mosaic-window">
                <div class="window-header">
                  <div class="window-dots"><span /><span /><span /></div>
                  <span class="window-title">Todo</span>
                </div>
                <div class="window-content">
                  <div class="fake-todo">
                    <div class="fake-checkbox checked">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span class="fake-label done">Buy groceries</span>
                  </div>
                  <div class="fake-todo">
                    <div class="fake-checkbox checked">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span class="fake-label done">Read article</span>
                  </div>
                  <div class="fake-todo">
                    <div class="fake-checkbox" />
                    <span class="fake-label">Finish report</span>
                  </div>
                  <div class="fake-todo add">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="add-icon">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add task</span>
                  </div>
                </div>
              </div>
            </div>
            <span class="mosaic-label">Todo</span>
          </div>

          <div class="mosaic-card" style="--rotation: 2deg;">
            <div class="mosaic-preview">
              <div class="mosaic-window">
                <div class="window-header">
                  <div class="window-dots"><span /><span /><span /></div>
                  <span class="window-title">Timer</span>
                </div>
                <div class="window-content timer-content">
                  <div class="timer-ring-wrapper">
                    <svg class="timer-ring" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" class="timer-bg" />
                      <circle cx="60" cy="60" r="52" class="timer-progress" style="--progress: 0.65;" />
                    </svg>
                    <div class="timer-time">16:15</div>
                  </div>
                  <div class="timer-session">Session 2/4</div>
                </div>
              </div>
            </div>
            <span class="mosaic-label">Timer</span>
          </div>
        </div>

        <!-- Row 2: Kanban (center, wider) -->
        <div class="mosaic-row center">
          <div class="mosaic-card" style="--rotation: -1deg;">
            <div class="mosaic-preview">
              <div class="mosaic-window wide">
                <div class="window-header">
                  <div class="window-dots"><span /><span /><span /></div>
                  <span class="window-title">Kanban</span>
                </div>
                <div class="window-content kanban-content">
                  <div class="kanban-column">
                    <div class="column-header">
                      <span class="column-dot" style="background: #f59e0b;" />
                      <span class="column-name">To Do</span>
                      <span class="column-count">2</span>
                    </div>
                    <div class="kanban-card-item">Design review</div>
                    <div class="kanban-card-item">API docs</div>
                  </div>
                  <div class="kanban-column">
                    <div class="column-header">
                      <span class="column-dot" style="background: #3b82f6;" />
                      <span class="column-name">In Progress</span>
                      <span class="column-count">1</span>
                    </div>
                    <div class="kanban-card-item">Homepage</div>
                  </div>
                  <div class="kanban-column">
                    <div class="column-header">
                      <span class="column-dot" style="background: #22c55e;" />
                      <span class="column-name">Done</span>
                      <span class="column-count">3</span>
                    </div>
                    <div class="kanban-card-item">Login flow</div>
                    <div class="kanban-card-item">User tests</div>
                  </div>
                </div>
              </div>
            </div>
            <span class="mosaic-label">Kanban</span>
          </div>
        </div>

        <!-- Row 3: Stats + Habits + Text -->
        <div class="mosaic-row">
          <div class="mosaic-card" style="--rotation: 2deg;">
            <div class="mosaic-preview">
              <div class="mosaic-window small">
                <div class="window-header">
                  <div class="window-dots"><span /><span /><span /></div>
                  <span class="window-title">Stats</span>
                </div>
                <div class="window-content stats-content">
                  <div class="stat-value">42</div>
                  <div class="stat-label">Tasks done</div>
                  <div class="stat-bar">
                    <div class="stat-fill" style="width: 68%;" />
                  </div>
                </div>
              </div>
            </div>
            <span class="mosaic-label">Stats</span>
          </div>

          <div class="mosaic-card" style="--rotation: -2deg;">
            <div class="mosaic-preview">
              <div class="mosaic-window">
                <div class="window-header">
                  <div class="window-dots"><span /><span /><span /></div>
                  <span class="window-title">Habits</span>
                </div>
                <div class="window-content habit-content">
                  <div class="habit-row">
                    <span class="habit-name">Exercise</span>
                    <div class="habit-grid">
                      <span class="filled" /><span class="filled" /><span /><span class="filled" /><span class="filled" /><span class="filled" /><span class="today" />
                    </div>
                  </div>
                  <div class="habit-row">
                    <span class="habit-name">Reading</span>
                    <div class="habit-grid">
                      <span class="filled" /><span /><span class="filled" /><span class="filled" /><span /><span class="filled" /><span />
                    </div>
                  </div>
                  <div class="habit-row">
                    <span class="habit-name">Meditate</span>
                    <div class="habit-grid">
                      <span class="filled" /><span class="filled" /><span class="filled" /><span class="filled" /><span class="filled" /><span class="filled" /><span class="filled today" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <span class="mosaic-label">Habits</span>
          </div>

          <div class="mosaic-card" style="--rotation: 1.5deg;">
            <div class="mosaic-preview">
              <div class="mosaic-window small">
                <div class="window-header">
                  <div class="window-dots"><span /><span /><span /></div>
                  <span class="window-title">Text</span>
                </div>
                <div class="window-content text-content">
                  <div class="text-heading">Notes</div>
                  <div class="text-paragraph">
                    <span class="text-line">Meeting notes for</span>
                    <span class="text-line">the Q2 roadmap...</span>
                  </div>
                </div>
              </div>
            </div>
            <span class="mosaic-label">Text</span>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section>
      <h2 class="serif-heading">How it works</h2>
      <ol class="steps">
        <li><strong>Download or open online</strong> — Get the macOS app or use the web version. No account needed.</li>
        <li><strong>Create your board</strong> — Start blank. Drop widgets, draw shapes, organize your way.</li>
        <li><strong>Own your data</strong> — Everything stays on your device. Export anytime.</li>
      </ol>
    </section>

    <!-- Pricing -->
    <section id="pricing">
      <h2 class="serif-heading">Pricing</h2>

      <div class="pricing-item">
        <h3>Personal <span class="serif-heading">— free forever</span></h3>
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
        <h3>Commercial <span class="serif-heading">— 50€/user/year</span></h3>
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
        <h3>Supporter <span class="serif-heading">— 25€+ one-time</span></h3>
        <p>Love what we're building? Support development with a donation. Get a badge on Discord and early access to betas.</p>
        <a href="https://github.com/sponsors/kevinbarfleur" class="btn">Become a Supporter</a>
      </div>
    </section>

    <!-- FAQ -->
    <section>
      <h2 class="serif-heading">Questions</h2>

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
      <h2 class="serif-heading">Ready to own your whiteboard?</h2>
      <p>No account. No cloud. Just you.</p>
      <div class="hero-buttons">
        <a href="https://app.boardkit.sh" class="btn">Try Online</a>
        <a href="https://github.com/kevinbarfleur/boardkit/releases" class="btn">Download macOS</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Typography - Serif for headings (matches app) */
.serif-heading {
  font-family: 'Source Serif 4', serif;
  font-style: italic;
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

/* Section subtitle */
.section-subtitle {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 16px;
  font-style: italic;
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

/* Plugin Code Examples */
.code-examples {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid hsl(var(--border));
}

.code-title {
  font-size: 22px;
  font-weight: 500;
  margin-bottom: 8px;
}

.code-subtitle {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 24px;
}

.code-block {
  background: #0a0a0a;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.code-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #111;
  border-bottom: 1px solid hsl(var(--border));
}

.code-filename {
  font-family: ui-monospace, 'SF Mono', Menlo, Monaco, monospace;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.code-content {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: ui-monospace, 'SF Mono', Menlo, Monaco, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: hsl(var(--foreground));
  background: transparent;
}

.code-content code {
  font-family: inherit;
  color: inherit;
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
  font-family: 'Source Serif 4', serif;
  font-size: 22px;
  font-weight: 600;
  font-style: italic;
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

.pricing-item h3 .serif-heading {
  font-size: 18px;
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

/* Mosaic - Cloud layout */
.mosaic-section {
  padding: 32px 0 48px;
  margin: 0 -40px; /* Slight overflow from container */
}

.mosaic-cloud {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.mosaic-row {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.mosaic-row.center {
  /* Center row can be slightly wider */
}

.mosaic-card {
  transform: rotate(var(--rotation, 0deg));
  transition: transform 0.2s ease;
}

.mosaic-card:hover {
  transform: rotate(0deg) translateY(-3px) scale(1.02);
  z-index: 10;
}

.mosaic-preview {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 5px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px hsl(var(--border));
}

.mosaic-window {
  width: 145px;
  height: 105px;
  background: #0f0f0f;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mosaic-window.wide {
  width: 310px;
  height: 90px;
}

.mosaic-window.small {
  width: 115px;
  height: 90px;
}

.window-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #1a1a1a;
  border-bottom: 1px solid #222;
}

.window-dots {
  display: flex;
  gap: 4px;
}

.window-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #333;
}

.window-title {
  font-size: 9px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.window-content {
  flex: 1;
  padding: 8px;
  overflow: hidden;
}

.mosaic-label {
  display: block;
  text-align: center;
  font-family: 'Source Serif 4', serif;
  font-size: 15px;
  font-style: italic;
  color: hsl(var(--muted-foreground));
  margin-top: 8px;
}

/* Todo Widget */
.fake-todo {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.fake-todo.add {
  color: hsl(var(--muted-foreground));
  font-size: 9px;
  margin-top: 4px;
  opacity: 0.7;
}

.fake-todo .add-icon {
  width: 10px;
  height: 10px;
}

.fake-checkbox {
  width: 10px;
  height: 10px;
  border: 1.5px solid #444;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fake-checkbox.checked {
  background: hsl(var(--foreground));
  border-color: hsl(var(--foreground));
}

.fake-checkbox svg {
  width: 7px;
  height: 7px;
  stroke: #0f0f0f;
}

.fake-label {
  font-size: 10px;
  color: hsl(var(--foreground));
}

.fake-label.done {
  text-decoration: line-through;
  color: hsl(var(--muted-foreground));
}

/* Timer Widget */
.timer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.timer-ring-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
}

.timer-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-bg {
  fill: none;
  stroke: #2a2a2a;
  stroke-width: 6;
}

.timer-progress {
  fill: none;
  stroke: hsl(var(--foreground));
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 327;
  stroke-dashoffset: calc(327 * (1 - var(--progress, 0)));
}

.timer-time {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.timer-session {
  font-size: 9px;
  color: hsl(var(--muted-foreground));
  margin-top: 4px;
}

/* Kanban Widget */
.kanban-content {
  display: flex;
  gap: 8px;
  height: 100%;
}

.kanban-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  padding: 4px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid #222;
}

.column-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.column-name {
  font-size: 8px;
  font-weight: 600;
  color: hsl(var(--foreground));
  flex: 1;
}

.column-count {
  font-size: 8px;
  color: hsl(var(--muted-foreground));
}

.kanban-card-item {
  background: #1a1a1a;
  border-radius: 3px;
  padding: 4px 6px;
  font-size: 8px;
  color: hsl(var(--foreground));
  margin-bottom: 3px;
  border: 1px solid #222;
}

/* Stats Widget */
.stats-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: hsl(var(--foreground));
  line-height: 1;
}

.stat-label {
  font-size: 9px;
  color: hsl(var(--muted-foreground));
  margin: 4px 0 8px;
}

.stat-bar {
  width: 80%;
  height: 4px;
  background: #2a2a2a;
  border-radius: 2px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 2px;
}

.stat-sublabel {
  font-size: 8px;
  color: hsl(var(--muted-foreground));
  margin-top: 4px;
}

/* Habits Widget */
.habit-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.habit-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.habit-name {
  font-size: 9px;
  color: hsl(var(--foreground));
  width: 48px;
  flex-shrink: 0;
}

.habit-grid {
  display: flex;
  gap: 2px;
}

.habit-grid span {
  width: 10px;
  height: 10px;
  background: #2a2a2a;
  border-radius: 2px;
}

.habit-grid span.filled {
  background: #22c55e;
}

.habit-grid span.today {
  box-shadow: 0 0 0 1px hsl(var(--foreground));
}

/* Text Widget */
.text-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.text-heading {
  font-size: 11px;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 2px;
}

.text-paragraph {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.text-line {
  font-size: 8px;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
}

.text-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 2px;
}

.text-bullet {
  font-size: 8px;
  color: hsl(var(--muted-foreground));
  padding-left: 8px;
  position: relative;
}

.text-bullet::before {
  content: '•';
  position: absolute;
  left: 0;
}

.text-footer {
  padding: 4px 8px;
  border-top: 1px solid #222;
  background: #1a1a1a;
  margin: auto -8px -8px;
  font-size: 8px;
  color: hsl(var(--muted-foreground));
}

/* Responsive */
@media (max-width: 520px) {
  .hero {
    flex-direction: column;
    padding: 48px 0 32px;
  }

  .hero-icon {
    width: 56px;
    height: 56px;
  }

  .hero-content h1 {
    font-size: 28px;
  }

  .mosaic-section {
    margin: 0 -20px;
  }

  .mosaic-cloud {
    gap: 8px;
  }

  .mosaic-row {
    flex-wrap: wrap;
    gap: 8px;
  }

  .mosaic-window {
    width: 120px;
    height: 95px;
  }

  .mosaic-window.wide {
    width: 260px;
    height: 80px;
  }

  .mosaic-window.small {
    width: 100px;
    height: 80px;
  }

  .kanban-card-item {
    font-size: 7px;
    padding: 3px 4px;
  }

  .column-name {
    font-size: 7px;
  }
}
</style>
