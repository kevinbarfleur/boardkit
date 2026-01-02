<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Top Bar Proposals — Boardkit',
})

// Simulate dropdown states
const openMenu = ref<string | null>(null)

function toggleMenu(menu: string) {
  openMenu.value = openMenu.value === menu ? null : menu
}

function closeMenus() {
  openMenu.value = null
}
</script>

<template>
  <div class="proposals-page" @click="closeMenus">
    <header class="proposals-header">
      <h1>Top Bar Proposals</h1>
      <p>Replacing the sidebar with a clean menu bar</p>
    </header>

    <!-- Proposal 1: macOS Style -->
    <section class="proposal-section">
      <div class="proposal-label">
        <span class="proposal-number">01</span>
        <h2>macOS Style</h2>
        <p>Menu bar classique avec logo à gauche, menus au centre-gauche, actions à droite</p>
      </div>

      <div class="topbar-preview">
        <div class="topbar style-1">
          <!-- Logo -->
          <div class="topbar-logo" @click.stop>
            <span class="letter-b">B</span><span class="letter-k">K</span>
          </div>

          <!-- Menus -->
          <nav class="topbar-menus">
            <div class="menu-item" :class="{ active: openMenu === '1-file' }" @click.stop="toggleMenu('1-file')">
              File
              <div v-if="openMenu === '1-file'" class="dropdown">
                <button class="dropdown-item">
                  <span>New Board</span>
                  <span class="shortcut">⌘N</span>
                </button>
                <button class="dropdown-item">
                  <span>Open...</span>
                  <span class="shortcut">⌘O</span>
                </button>
                <div class="dropdown-separator" />
                <button class="dropdown-item">
                  <span>Save</span>
                  <span class="shortcut">⌘S</span>
                </button>
                <button class="dropdown-item">
                  <span>Export...</span>
                  <span class="shortcut">⇧⌘E</span>
                </button>
              </div>
            </div>

            <div class="menu-item" :class="{ active: openMenu === '1-edit' }" @click.stop="toggleMenu('1-edit')">
              Edit
              <div v-if="openMenu === '1-edit'" class="dropdown">
                <button class="dropdown-item">
                  <span>Undo</span>
                  <span class="shortcut">⌘Z</span>
                </button>
                <button class="dropdown-item">
                  <span>Redo</span>
                  <span class="shortcut">⇧⌘Z</span>
                </button>
                <div class="dropdown-separator" />
                <button class="dropdown-item">
                  <span>Cut</span>
                  <span class="shortcut">⌘X</span>
                </button>
                <button class="dropdown-item">
                  <span>Copy</span>
                  <span class="shortcut">⌘C</span>
                </button>
                <button class="dropdown-item">
                  <span>Paste</span>
                  <span class="shortcut">⌘V</span>
                </button>
              </div>
            </div>

            <div class="menu-item" :class="{ active: openMenu === '1-view' }" @click.stop="toggleMenu('1-view')">
              View
              <div v-if="openMenu === '1-view'" class="dropdown">
                <button class="dropdown-item">
                  <span>Zoom In</span>
                  <span class="shortcut">⌘+</span>
                </button>
                <button class="dropdown-item">
                  <span>Zoom Out</span>
                  <span class="shortcut">⌘-</span>
                </button>
                <button class="dropdown-item">
                  <span>Fit to Screen</span>
                  <span class="shortcut">⌘0</span>
                </button>
                <div class="dropdown-separator" />
                <button class="dropdown-item">
                  <span>Show Grid</span>
                  <span class="shortcut">⌘G</span>
                </button>
              </div>
            </div>

            <div class="menu-item" :class="{ active: openMenu === '1-insert' }" @click.stop="toggleMenu('1-insert')">
              Insert
              <div v-if="openMenu === '1-insert'" class="dropdown">
                <button class="dropdown-item">
                  <span>Rectangle</span>
                  <span class="shortcut">R</span>
                </button>
                <button class="dropdown-item">
                  <span>Ellipse</span>
                  <span class="shortcut">O</span>
                </button>
                <button class="dropdown-item">
                  <span>Line</span>
                  <span class="shortcut">L</span>
                </button>
                <button class="dropdown-item">
                  <span>Arrow</span>
                  <span class="shortcut">A</span>
                </button>
                <button class="dropdown-item">
                  <span>Text</span>
                  <span class="shortcut">T</span>
                </button>
                <div class="dropdown-separator" />
                <button class="dropdown-item has-submenu">
                  <span>Widget</span>
                  <span class="arrow">›</span>
                </button>
              </div>
            </div>
          </nav>

          <!-- Right side -->
          <div class="topbar-right">
            <button class="topbar-icon-btn" title="Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Proposal 2: Minimal -->
    <section class="proposal-section">
      <div class="proposal-label">
        <span class="proposal-number">02</span>
        <h2>Minimal</h2>
        <p>Logo cliquable qui ouvre le menu principal, actions essentielles visibles</p>
      </div>

      <div class="topbar-preview">
        <div class="topbar style-2">
          <!-- Logo as menu trigger -->
          <div class="topbar-logo-menu" :class="{ active: openMenu === '2-main' }" @click.stop="toggleMenu('2-main')">
            <div class="logo-circle">
              <span class="letter-b">B</span><span class="letter-k">K</span>
            </div>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 9 6 6 6-6" />
            </svg>

            <div v-if="openMenu === '2-main'" class="dropdown dropdown-wide">
              <div class="dropdown-section">
                <span class="dropdown-section-title">File</span>
                <button class="dropdown-item">
                  <span>New Board</span>
                  <span class="shortcut">⌘N</span>
                </button>
                <button class="dropdown-item">
                  <span>Open...</span>
                  <span class="shortcut">⌘O</span>
                </button>
                <button class="dropdown-item">
                  <span>Save</span>
                  <span class="shortcut">⌘S</span>
                </button>
              </div>
              <div class="dropdown-separator" />
              <div class="dropdown-section">
                <span class="dropdown-section-title">Application</span>
                <button class="dropdown-item">
                  <span>Settings</span>
                  <span class="shortcut">⌘,</span>
                </button>
                <button class="dropdown-item">
                  <span>Plugins</span>
                </button>
                <button class="dropdown-item">
                  <span>Keyboard Shortcuts</span>
                  <span class="shortcut">⌘K</span>
                </button>
              </div>
              <div class="dropdown-separator" />
              <button class="dropdown-item text-muted">
                <span>Boardkit v0.1.0</span>
              </button>
            </div>
          </div>

          <!-- Document name -->
          <div class="topbar-center">
            <span class="doc-name">Untitled Board</span>
            <span class="doc-status">Saved</span>
          </div>

          <!-- Quick actions -->
          <div class="topbar-right">
            <button class="topbar-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
              Widgets
            </button>
            <button class="topbar-icon-btn" title="Share">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Proposal 3: Notion Style -->
    <section class="proposal-section">
      <div class="proposal-label">
        <span class="proposal-number">03</span>
        <h2>Notion Style</h2>
        <p>Breadcrumb central, menus contextuels, très minimal</p>
      </div>

      <div class="topbar-preview">
        <div class="topbar style-3">
          <!-- Left actions -->
          <div class="topbar-left">
            <button class="topbar-icon-btn" title="Menu" :class="{ active: openMenu === '3-menu' }" @click.stop="toggleMenu('3-menu')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>

              <div v-if="openMenu === '3-menu'" class="dropdown">
                <button class="dropdown-item">
                  <span>New Board</span>
                  <span class="shortcut">⌘N</span>
                </button>
                <button class="dropdown-item">
                  <span>Open...</span>
                  <span class="shortcut">⌘O</span>
                </button>
                <div class="dropdown-separator" />
                <button class="dropdown-item">
                  <span>Settings</span>
                  <span class="shortcut">⌘,</span>
                </button>
                <button class="dropdown-item">
                  <span>Plugins</span>
                </button>
              </div>
            </button>
          </div>

          <!-- Center: Breadcrumb -->
          <div class="topbar-breadcrumb">
            <div class="breadcrumb-logo">
              <span class="letter-b">B</span><span class="letter-k">K</span>
            </div>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-item">Untitled Board</span>
          </div>

          <!-- Right actions -->
          <div class="topbar-right">
            <button class="topbar-icon-btn" title="Share">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </button>
            <button class="topbar-icon-btn" :class="{ active: openMenu === '3-more' }" @click.stop="toggleMenu('3-more')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>

              <div v-if="openMenu === '3-more'" class="dropdown dropdown-right">
                <button class="dropdown-item">
                  <span>Export...</span>
                  <span class="shortcut">⇧⌘E</span>
                </button>
                <button class="dropdown-item">
                  <span>Duplicate</span>
                </button>
                <div class="dropdown-separator" />
                <button class="dropdown-item text-danger">
                  <span>Delete</span>
                </button>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Proposal 4: Figma Style -->
    <section class="proposal-section">
      <div class="proposal-label">
        <span class="proposal-number">04</span>
        <h2>Figma Style</h2>
        <p>Logo-menu hamburger, nom du fichier éditable au centre, utilisateurs/partage à droite</p>
      </div>

      <div class="topbar-preview">
        <div class="topbar style-4">
          <!-- Logo + Menu -->
          <div class="topbar-left">
            <div class="figma-menu" :class="{ active: openMenu === '4-main' }" @click.stop="toggleMenu('4-main')">
              <div class="figma-logo">
                <span class="letter-b">B</span><span class="letter-k">K</span>
              </div>

              <div v-if="openMenu === '4-main'" class="dropdown dropdown-grid">
                <button class="dropdown-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dropdown-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M12 18v-6M9 15h6" />
                  </svg>
                  <span>New</span>
                </button>
                <button class="dropdown-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dropdown-icon">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Open</span>
                </button>
                <button class="dropdown-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dropdown-icon">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <path d="M17 21v-8H7v8M7 3v5h8" />
                  </svg>
                  <span>Save</span>
                </button>
                <button class="dropdown-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dropdown-icon">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  <span>Settings</span>
                </button>
                <button class="dropdown-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dropdown-icon">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>Plugins</span>
                </button>
                <button class="dropdown-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dropdown-icon">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <span>Help</span>
                </button>
              </div>
            </div>

            <div class="topbar-separator" />

            <!-- Quick tools -->
            <button class="tool-btn" title="Select (V)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              </svg>
            </button>
            <button class="tool-btn" title="Rectangle (R)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
            <button class="tool-btn" title="Text (T)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
              </svg>
            </button>
          </div>

          <!-- Center: File name -->
          <div class="topbar-center">
            <input type="text" value="Untitled Board" class="file-name-input" />
          </div>

          <!-- Right: Share -->
          <div class="topbar-right">
            <button class="share-btn">Share</button>
          </div>
        </div>
      </div>
    </section>

    <footer class="proposals-footer">
      <a href="/" class="back-link">← Back to Landing</a>
    </footer>
  </div>
</template>

<style scoped>
.proposals-page {
  min-height: 100vh;
  padding: 60px 40px;
  background: hsl(var(--background));
}

.proposals-header {
  text-align: center;
  margin-bottom: 60px;
}

.proposals-header h1 {
  font-family: 'Source Serif 4', serif;
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 8px;
  color: hsl(var(--foreground));
}

.proposals-header p {
  font-size: 16px;
  color: hsl(var(--muted-foreground));
}

/* Proposal sections */
.proposal-section {
  max-width: 1000px;
  margin: 0 auto 60px;
}

.proposal-label {
  margin-bottom: 20px;
}

.proposal-number {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.proposal-label h2 {
  font-size: 24px;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 4px 0 8px;
}

.proposal-label p {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

/* Top bar preview container */
.topbar-preview {
  background: #0a0a0a;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  overflow: hidden;
}

/* Base topbar styles */
.topbar {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
  position: relative;
}

/* Logo styles */
.topbar-logo,
.logo-circle,
.figma-logo,
.breadcrumb-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Source Serif 4', serif;
  font-weight: 600;
  user-select: none;
}

.topbar-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: hsl(var(--foreground));
  font-size: 14px;
}

.topbar-logo .letter-b,
.logo-circle .letter-b,
.figma-logo .letter-b,
.breadcrumb-logo .letter-b {
  color: hsl(var(--background));
  position: relative;
  z-index: 2;
}

.topbar-logo .letter-k,
.logo-circle .letter-k,
.figma-logo .letter-k,
.breadcrumb-logo .letter-k {
  color: hsl(var(--background));
  opacity: 0.55;
  margin-left: -3px;
}

/* Menu items */
.topbar-menus {
  display: flex;
  gap: 4px;
  margin-left: 16px;
}

.menu-item {
  position: relative;
  padding: 6px 12px;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.menu-item:hover,
.menu-item.active {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

/* Dropdowns */
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 200px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.dropdown-right {
  left: auto;
  right: 0;
}

.dropdown-wide {
  min-width: 240px;
}

.dropdown-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  min-width: 280px;
  padding: 8px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  color: hsl(var(--foreground));
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.dropdown-item:hover {
  background: hsl(var(--muted));
}

.dropdown-grid .dropdown-item {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  gap: 8px;
}

.dropdown-icon {
  width: 20px;
  height: 20px;
  stroke: hsl(var(--muted-foreground));
}

.dropdown-grid .dropdown-item:hover .dropdown-icon {
  stroke: hsl(var(--foreground));
}

.shortcut {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  font-family: ui-monospace, monospace;
}

.arrow {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.dropdown-separator {
  height: 1px;
  background: hsl(var(--border));
  margin: 6px 0;
}

.dropdown-section-title {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  padding: 4px 12px 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.text-muted {
  color: hsl(var(--muted-foreground)) !important;
}

.text-danger {
  color: #ef4444 !important;
}

/* Right side */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.topbar-icon-btn {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: all 0.15s;
}

.topbar-icon-btn:hover,
.topbar-icon-btn.active {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.topbar-icon-btn svg {
  width: 18px;
  height: 18px;
}

.topbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: hsl(var(--foreground));
  background: hsl(var(--muted));
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.topbar-btn:hover {
  background: hsl(var(--border));
}

.topbar-btn svg {
  width: 16px;
  height: 16px;
}

/* Style 2 specific */
.topbar-logo-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.topbar-logo-menu:hover,
.topbar-logo-menu.active {
  background: hsl(var(--muted));
}

.logo-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: hsl(var(--foreground));
  font-size: 12px;
}

.chevron {
  width: 14px;
  height: 14px;
  stroke: hsl(var(--muted-foreground));
}

.doc-name {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.doc-status {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

/* Style 3 specific */
.topbar.style-3 {
  justify-content: space-between;
}

.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: hsl(var(--foreground));
  font-size: 10px;
}

.breadcrumb-sep {
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.breadcrumb-item {
  font-size: 14px;
  color: hsl(var(--foreground));
}

/* Style 4 specific */
.figma-menu {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.figma-menu:hover,
.figma-menu.active {
  background: hsl(var(--muted));
}

.figma-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: hsl(var(--foreground));
  font-size: 12px;
}

.topbar-separator {
  width: 1px;
  height: 24px;
  background: hsl(var(--border));
  margin: 0 8px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.tool-btn svg {
  width: 18px;
  height: 18px;
}

.file-name-input {
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
  text-align: center;
  padding: 4px 8px;
  border-radius: 4px;
  outline: none;
  width: 200px;
}

.file-name-input:hover {
  background: hsl(var(--muted));
}

.file-name-input:focus {
  background: hsl(var(--muted));
  outline: 2px solid hsl(var(--border));
}

.share-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.share-btn:hover {
  opacity: 0.9;
}

/* Footer */
.proposals-footer {
  margin-top: 60px;
  text-align: center;
}

.back-link {
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  text-decoration: none;
}

.back-link:hover {
  color: hsl(var(--foreground));
}
</style>
