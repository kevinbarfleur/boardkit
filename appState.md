# État Actuel de l'Application Boardkit

**Date de génération:** 2024  
**Version:** 0.1.0  
**Type:** Whiteboard modulaire, offline-first, cross-platform

---

## Vue d'Ensemble

Boardkit est un whiteboard modulaire open-source conçu pour fonctionner hors ligne en priorité. L'application supporte deux plateformes principales : Web (PWA) et Desktop (macOS via Tauri). L'architecture est basée sur un système de modules extensibles permettant d'ajouter facilement de nouveaux types de widgets.

### Philosophie de Conception

- **Offline-first** : Fonctionne sans connexion internet
- **Modulaire** : Système de modules extensibles pour créer de nouveaux widgets
- **Cross-platform** : Web et Desktop (macOS)
- **Portable** : Format de fichier `.boardkit` pour l'import/export
- **Canvas-first** : Interface centrée sur le canvas infini

---

## Architecture Générale

### Structure Monorepo

Le projet utilise un monorepo pnpm avec la structure suivante :

```
boardkit/
├── apps/
│   ├── web/          # Application web (Vue 3 + Vite + PWA)
│   └── desktop/       # Application desktop (Tauri + Vue 3)
├── packages/
│   ├── core/         # Logique métier, stores, SDK modules
│   ├── ui/           # Design system et composants partagés
│   └── platform/     # Adaptateurs plateforme (storage, etc.)
└── docs/
```

### Séparation des Responsabilités

- **`@boardkit/core`** : Logique métier indépendante de la plateforme

  - Gestion du document (BoardkitDocument)
  - Store Pinia (boardStore)
  - Système de modules (ModuleRegistry)
  - Système d'actions (ActionRegistry)
  - Raccourcis clavier

- **`@boardkit/ui`** : Design system et composants Vue réutilisables

  - Composants de base (Button, Input, Modal, etc.)
  - WidgetFrame (conteneur de widgets avec drag/resize)
  - Command Palette components
  - Thème (light/dark)

- **`@boardkit/platform`** : Adaptateurs spécifiques à la plateforme
  - Storage (IndexedDB pour web, filesystem pour desktop)
  - History storage

---

## Modèle de Données

### BoardkitDocument

Structure principale du document :

```typescript
interface BoardkitDocument {
  version: number; // Version du format (actuellement 0)
  meta: {
    title: string; // Titre du board
    createdAt: number; // Timestamp de création
    updatedAt: number; // Timestamp de dernière modification
  };
  board: {
    viewport: {
      x: number; // Position X du viewport
      y: number; // Position Y du viewport
      zoom: number; // Niveau de zoom (0.1 à 3)
    };
    widgets: Array<{
      id: string; // ID unique du widget (nanoid)
      moduleId: string; // ID du module utilisé
      rect: {
        x: number; // Position X sur le canvas
        y: number; // Position Y sur le canvas
        width: number; // Largeur du widget
        height: number; // Hauteur du widget
      };
      zIndex: number; // Ordre d'affichage (plus haut = devant)
    }>;
  };
  modules: {
    [widgetId: string]: unknown; // État sérialisé de chaque widget
  };
}
```

### Format de Fichier `.boardkit`

Format ZIP contenant :

- `package.json` : Métadonnées du fichier (nom, version, formatVersion)
- `board.json` : Document BoardkitDocument sérialisé

---

## Système de Modules

### Architecture Modulaire

Chaque module est un widget indépendant qui peut être ajouté au canvas. Les modules suivent un contrat strict défini par `ModuleDefinition` :

```typescript
interface ModuleDefinition<TState> {
  moduleId: string; // ID unique stable
  version: string; // Version semver
  displayName: string; // Nom affiché dans l'UI
  component: Component; // Composant Vue
  defaultState: () => TState; // État initial
  serialize: (state: TState) => unknown;
  deserialize: (data: unknown) => TState;
  minWidth?: number; // Largeur minimale (défaut: 200)
  minHeight?: number; // Hauteur minimale (défaut: 100)
  defaultWidth?: number; // Largeur par défaut (défaut: 300)
  defaultHeight?: number; // Hauteur par défaut (défaut: 200)
}
```

### Règles Strictes des Modules

1. **Isolation** : Les modules ne peuvent pas accéder à l'état d'autres modules
2. **Pas de UI de frame** : Les modules utilisent `WidgetFrame` partagé pour drag/resize
3. **Sérialisation complète** : Tous les états doivent être sérialisables
4. **Stabilité** : `moduleId` et `version` doivent être stables

### Modules Actuels

#### 1. Module Text (`text`)

**Fichiers:** `apps/web/src/modules/text/`

**État:**

```typescript
interface TextState {
  content: string; // Contenu markdown
}
```

**Fonctionnalités:**

- Éditeur riche basé sur Tiptap
- Support Markdown complet
- Extensions Tiptap :
  - StarterKit (headings, lists, bold, italic, etc.)
  - Markdown (bidirectionnel)
  - Placeholder
  - Typography (smart quotes, dashes, etc.)
  - TaskList / TaskItem
  - Link (auto-link)
  - CodeBlockLowlight (syntax highlighting)
- Sauvegarde en Markdown
- Placeholder personnalisable

**Composant:** `TextWidget.vue` utilise `TiptapEditor.vue`

#### 2. Module Todo (`todo`)

**Fichiers:** `apps/web/src/modules/todo/`

**État:**

```typescript
interface TodoState {
  title: string; // Titre de la liste
  description: string; // Description optionnelle
  items: Array<{
    id: string; // ID unique (nanoid)
    label: string; // Texte de la tâche
    completed: boolean; // État de complétion
  }>;
}
```

**Fonctionnalités:**

- Liste de tâches avec checkboxes
- Ajout de tâches (Enter pour valider)
- Suppression de tâches (bouton X au survol)
- Toggle complétion
- Titre et description éditables (visibles seulement quand sélectionné)
- Compteur de progression (X/Y complétés)
- Mode "rest" : affiche seulement les tâches et le compteur
- Mode "selected" : affiche les champs d'édition et boutons de suppression

**Composant:** `TodoWidget.vue`

---

## Gestion d'État (Pinia)

### BoardStore (`packages/core/src/stores/boardStore.ts`)

Store principal gérant l'état du document et des widgets.

**État:**

- `document: BoardkitDocument | null` - Document actuel
- `selectedWidgetId: string | null` - Widget sélectionné
- `isDirty: boolean` - Indique si le document a des modifications non sauvegardées
- `lastAction: string` - Dernière action effectuée (pour l'historique)

**Getters:**

- `widgets` - Liste des widgets
- `viewport` - État du viewport
- `moduleStates` - États sérialisés de tous les widgets
- `title` - Titre du document
- `selectedWidget` - Widget sélectionné (objet complet)
- `maxZIndex` - Z-index maximum (pour mettre au premier plan)

**Actions principales:**

- `createNewBoard(title)` - Créer un nouveau board
- `loadDocument(doc)` - Charger un document
- `setTitle(newTitle)` - Modifier le titre
- `addWidget(moduleId, x?, y?)` - Ajouter un widget
- `removeWidget(widgetId)` - Supprimer un widget
- `moveWidget(widgetId, x, y)` - Déplacer un widget
- `resizeWidget(widgetId, width, height)` - Redimensionner un widget
- `duplicateWidget(widgetId)` - Dupliquer un widget
- `nudgeWidget(widgetId, dx, dy)` - Déplacer légèrement (raccourcis clavier)
- `selectWidget(widgetId)` - Sélectionner un widget (met au premier plan)
- `clearSelection()` - Désélectionner
- `updateViewport(viewport)` - Mettre à jour le viewport
- `getModuleState<T>(widgetId)` - Obtenir l'état désérialisé d'un widget
- `updateModuleState<T>(widgetId, partial)` - Mettre à jour partiellement l'état
- `setModuleState<T>(widgetId, state)` - Remplacer complètement l'état
- `markDirty(action?)` - Marquer comme modifié
- `markClean()` - Marquer comme sauvegardé

---

## Système d'Actions

### Architecture

Le système d'actions unifie toutes les opérations utilisateur :

- Command Palette (Cmd/Ctrl + K)
- Context Menus (clic droit)
- Raccourcis clavier
- Menus de l'application

**Fichiers clés:**

- `packages/core/src/actions/ActionRegistry.ts` - Registre central
- `packages/core/src/actions/coreActions.ts` - Actions core
- `packages/core/src/types/action.ts` - Types et interfaces

### ActionDefinition

```typescript
interface ActionDefinition {
  id: string; // ID unique stable
  title: string; // Titre affiché
  subtitle?: string; // Description
  keywords?: string[]; // Mots-clés pour la recherche
  icon?: string; // Nom d'icône Lucide
  group: "board" | "widget" | "view" | "module";
  contexts: ("global" | "canvas" | "widget")[];
  shortcutHint?: string; // Indication de raccourci (affichage)
  priority?: number; // Priorité d'affichage (plus haut = premier)
  moduleId?: string; // ID du module si action de module
  when?: (ctx: ActionContext) => boolean; // Condition de disponibilité
  run: (ctx: ActionContext) => Promise<void> | void;
}
```

### Actions Core Disponibles

#### Actions Board

- `board.add-{moduleId}` - Ajouter un widget (dynamique, une par module)
  - Exemple: `board.add-text`, `board.add-todo`

#### Actions Widget

- `widget.duplicate` - Dupliquer le widget sélectionné (⌘D)
- `widget.delete` - Supprimer le widget sélectionné (⌫)
- `widget.bring-to-front` - Mettre au premier plan

#### Actions View

- `view.reset` - Réinitialiser le viewport (⌘0)
- `view.zoom-in` - Zoom avant (⌘+)
- `view.zoom-out` - Zoom arrière (⌘-)

#### Actions Selection

- `selection.clear` - Désélectionner (Esc)

#### Actions Web (spécifiques)

- `settings.open` - Ouvrir le panneau de paramètres du widget

---

## Canvas et Navigation

### BoardCanvas (`apps/web/src/components/BoardCanvas.vue`)

**Fonctionnalités:**

1. **Pan (Déplacement)**

   - Scroll de la souris/trackpad
   - Clic molette + drag
   - Espace + clic gauche + drag
   - Cursor change en "grab" quand Espace est pressé

2. **Zoom**

   - Cmd/Ctrl + Scroll (zoom vers le curseur)
   - Cmd/Ctrl + Plus/Moins (raccourcis clavier)
   - Plage: 0.1x à 3x
   - Zoom fluide avec `Math.exp()` pour une progression naturelle

3. **Grid Background**

   - Motif de points radiaux (radial-gradient)
   - Espacement de 20px
   - Opacité 10% (blanc)
   - Parallaxe avec le viewport (se déplace avec le pan)

4. **Widget Interaction**

   - Clic sur canvas vide : désélectionne
   - Clic sur widget : sélectionne
   - Drag du header : déplace le widget
   - Drag du coin (quand sélectionné) : redimensionne
   - Clic droit sur canvas : menu contextuel (actions "canvas")
   - Clic droit sur widget : menu contextuel (actions "widget")

5. **Gestion du Scroll**
   - Détection intelligente des conteneurs scrollables
   - Si le scroll est dans un widget scrollable, ne panne pas le canvas
   - Permet le scroll dans les widgets sans interférer avec le canvas

### WidgetFrame (`packages/ui/src/components/WidgetFrame.vue`)

Composant conteneur pour tous les widgets.

**Fonctionnalités:**

- **Positionnement absolu** avec transform
- **Drag & Drop** via le header flottant
- **Resize** via le coin inférieur droit (quand sélectionné)
- **États visuels:**
  - Rest (au repos) : transparent, subtil, ou visible
  - Hover (survol) : transparent, subtil, ou visible
  - Selected (sélectionné) : bordure primaire, ombre, fond card
- **Header flottant** : apparaît au-dessus du widget quand hover/selected
- **Bouton delete** dans le header (quand sélectionné)
- **Z-index** géré automatiquement (sélection = premier plan)

**Props:**

- `id`, `title`, `x`, `y`, `width`, `height`
- `minWidth`, `minHeight`
- `selected`, `zIndex`
- `restMode`, `hoverMode` (VisibilityMode)

---

## Persistance et Storage

### Web (`apps/web/src/composables/usePersistence.ts`)

**Storage:** IndexedDB via `@boardkit/platform`

**Fonctionnalités:**

1. **Gestion de Documents**

   - `createDocument(title)` - Créer un nouveau document
   - `openDocument(id)` - Ouvrir un document existant
   - `saveDocument(addHistory?)` - Sauvegarder le document actuel
   - `deleteDocument(id)` - Supprimer un document
   - `refreshDocumentList()` - Rafraîchir la liste

2. **Autosave**

   - Débounce de 500ms
   - Watch sur `boardStore.document` (deep)
   - Sauvegarde automatique quand `isDirty === true`
   - Ajoute à l'historique après sauvegarde

3. **Historique (History)**

   - Stockage dans IndexedDB (store séparé `history`)
   - Entrées limitées à 100 par document
   - Chaque entrée contient :
     - `id`, `documentId`, `timestamp`, `action`, `snapshot`
   - `undo()` - Revenir à la version précédente
   - `redo()` - Aller à la version suivante
   - `goToHistoryEntry(id)` - Aller à une version spécifique
   - `goToLatest()` - Revenir à la version la plus récente

4. **Import/Export**

   - `exportToFile()` - Exporter en `.boardkit` (ZIP)
   - `importFromFile()` - Importer un `.boardkit`
   - Utilise JSZip pour la compression

5. **Initialisation**
   - `initialize()` - Charge le dernier document ouvert ou crée un nouveau
   - Utilise `localStorage` pour mémoriser le document actuel
   - Fallback : ouvre le document le plus récent

### Desktop (`apps/desktop/src/composables/usePersistence.ts`)

**Storage:** Filesystem via Tauri API (`@tauri-apps/plugin-fs`)

**Fonctionnalités similaires** mais adaptées au filesystem :

- Sauvegarde dans des fichiers `.boardkit`
- Dialog de sélection de fichier (Tauri)
- Pas d'IndexedDB (utilise le filesystem local)

---

## Raccourcis Clavier

### Gestion (`packages/core/src/composables/useKeyboardShortcuts.ts`)

**Raccourcis disponibles:**

- `Escape` - Désélectionner / Fermer les menus
- `Delete` / `Backspace` - Supprimer le widget sélectionné
- `Cmd/Ctrl + D` - Dupliquer le widget sélectionné
- `Cmd/Ctrl + 0` - Réinitialiser le viewport
- `Cmd/Ctrl + K` - Ouvrir la command palette
- `Flèches` - Déplacer le widget sélectionné de 1px
- `Shift + Flèches` - Déplacer le widget sélectionné de 10px
- `Espace` - Activer le mode pan (cursor change)
- `Cmd/Ctrl + Scroll` - Zoom
- `Cmd/Ctrl + Plus` - Zoom avant
- `Cmd/Ctrl + Moins` - Zoom arrière

**Détection intelligente:**

- Désactivés quand focus sur input/textarea/contentEditable
- Détection Mac/Windows pour Cmd vs Ctrl
- Prévention du scroll par défaut pour Espace

---

## Command Palette

### Composant (`apps/web/src/components/CommandPalette.vue`)

**Fonctionnalités:**

- Recherche fuzzy sur titre, subtitle, keywords
- Groupement par catégories (board, widget, view, module)
- Tri par priorité puis alphabétique
- Navigation clavier (flèches, Enter)
- Filtrage en temps réel
- Icônes et raccourcis affichés

**Composants UI:** Utilise `BkCommandDialog`, `BkCommandInput`, `BkCommandList`, etc.

**Ouverture:** `Cmd/Ctrl + K` ou bouton dans la toolbar

---

## Design System

### Tokens (`packages/ui/DESIGN_SYSTEM.md`)

**Philosophie:**

- Compact par défaut (densité app)
- Surfaces calmes, hiérarchie claire
- Tokens sémantiques (pas de couleurs hardcodées)
- Consistance avant customisation

**Couleurs:**

- Background: `#0a0a0a` (noir profond)
- Foreground: `#ededed` (blanc cassé)
- Primary: `#3b82f6` (bleu)
- Destructive: `#ef4444` (rouge)
- Muted: `#1a1a1a` (gris foncé)
- Border: `#262626` (gris moyen)

**Typographie:**

- Font: Inter (ou Geist fallback)
- Tailles: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px)
- Poids: `font-normal` (400), `font-medium` (500), `font-semibold` (600)

**Espacement:**

- Base: 4px (multiples de 4)
- Composants: `h-9` (36px) pour boutons/inputs
- Padding: `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px)
- Gap: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px)

**Border Radius:**

- Base: `0.5rem` (8px)
- `rounded-lg` (8px) - surfaces, widgets
- `rounded-md` (6px) - inputs, petits boutons
- `rounded-sm` (4px) - petits éléments
- `rounded-full` - boutons icon circulaires

### Composants UI Disponibles

**Base:**

- `BkButton` - Bouton avec variants (default, destructive, outline, secondary, ghost, link)
- `BkIconButton` - Bouton icon circulaire
- `BkIcon` - Wrapper pour icônes Lucide
- `BkInput` - Input texte
- `BkTextarea` - Textarea
- `BkCheckbox` - Checkbox
- `BkDivider` - Séparateur horizontal/vertical

**Navigation:**

- `BkDropdown` - Menu déroulant
- `BkMenu` - Menu contextuel
- `BkContextMenu` - Menu contextuel (clic droit)
- `BkTooltip` - Tooltip

**Dialogs:**

- `BkModal` - Modal dialog
- `BkCommandDialog` - Command palette dialog

**Spécialisés:**

- `BkEditableText` - Texte éditable inline
- `BkHistoryList` - Liste d'historique (undo/redo)
- `WidgetFrame` - Conteneur de widget avec drag/resize

**Command Palette:**

- `BkCommandInput` - Input de recherche
- `BkCommandList` - Liste de résultats
- `BkCommandGroup` - Groupe de résultats
- `BkCommandItem` - Item de résultat
- `BkCommandEmpty` - État vide

---

## Thème

### Gestion (`packages/ui/src/composables/useTheme.ts`)

**Fonctionnalités:**

- Thème light/dark
- Détection de la préférence système
- Persistance dans `localStorage`
- Toggle manuel
- Application via classes CSS (`dark` sur `<html>`)

**Tokens CSS:** Variables CSS custom properties dans `globals.css`

---

## Application Web

### Structure (`apps/web/`)

**Tech Stack:**

- Vue 3 (Composition API)
- TypeScript
- Vite
- Vue Router
- Pinia
- Tailwind CSS
- PWA (vite-plugin-pwa)

### Pages

1. **Board** (`/`) - Page principale

   - Canvas infini
   - Toolbar
   - Command Palette
   - Settings Panel

2. **Playground** (`/playground`) - Page de test/développement

### Composants Principaux

1. **BoardCanvas** - Canvas principal avec pan/zoom
2. **Toolbar** - Barre d'outils supérieure
   - Logo + titre éditable
   - Menu fichier (New, Open, Export)
   - Command palette trigger
   - Undo/Redo avec dropdowns d'historique
   - Reset view
   - Theme toggle
3. **CommandPalette** - Palette de commandes
4. **WidgetRenderer** - Rendu dynamique des widgets
5. **SettingsPanel** - Panneau de paramètres latéral
6. **TiptapEditor** - Éditeur riche pour le module texte

### Composables

1. **usePersistence** - Gestion de la persistance (IndexedDB)
2. **useWidgetSettings** - Paramètres des widgets (localStorage)
3. **useSettingsPanel** - État du panneau de paramètres

### Actions Web

- `settings.open` - Ouvrir les paramètres d'un widget

### PWA

- Service Worker (Workbox)
- Manifest
- Icônes PWA (192x192, 512x512)
- Offline-first

---

## Application Desktop

### Structure (`apps/desktop/`)

**Tech Stack:**

- Tauri 2.0
- Vue 3 (même codebase que web)
- Rust backend minimal

### Configuration Tauri

**Fichier:** `src-tauri/tauri.conf.json`

**Paramètres:**

- Window: 1200x800 (min: 800x600)
- Dev URL: `http://localhost:3001`
- Build: utilise `dist` du build web

### Backend Rust

**Fichiers:**

- `src-tauri/src/main.rs` - Point d'entrée
- `src-tauri/src/lib.rs` - Logique principale

**Fonctionnalités:**

- Window management
- Menu integration (futur)
- File system access via plugins

### Différences avec Web

- Storage: Filesystem au lieu d'IndexedDB
- Pas de PWA
- Intégration menu système (futur)
- Raccourci global `Cmd+Shift+Space` (futur)

---

## Paramètres des Widgets

### Système (`apps/web/src/composables/useWidgetSettings.ts`)

**Storage:** `localStorage` (`boardkit:widget-settings`)

**Paramètres globaux:**

1. **Visibility (Apparence)**

   - `restMode`: 'transparent' | 'subtle' | 'visible'
   - `hoverMode`: 'transparent' | 'subtle' | 'visible'
   - `shareAcrossType`: boolean (partager entre widgets du même type)

2. **Text Module**

   - `fontSize`: 'small' | 'medium' | 'large'
   - `lineHeight`: 'compact' | 'normal' | 'spacious'
   - `enableShortcuts`: boolean
   - `autoLinks`: boolean
   - `smartTypography`: boolean
   - `placeholder`: string

3. **Todo Module**
   - `strikeCompleted`: boolean
   - `hideCompleted`: boolean
   - `autoSort`: boolean
   - `showProgress`: 'none' | 'bar' | 'counter'
   - `enableReorder`: boolean

**UI:** `SettingsPanel.vue` - Panneau latéral avec tous les paramètres

---

## Technologies et Dépendances

### Core Dependencies

- `vue`: ^3.4.0 - Framework UI
- `pinia`: ^2.1.7 - State management
- `nanoid`: ^5.0.4 - Génération d'IDs uniques
- `typescript`: ^5.3.0 - Typage statique

### Web Dependencies

- `vue-router`: ^4.6.4 - Routing
- `@tiptap/vue-3`: ^3.14.0 - Éditeur riche
- `@tiptap/starter-kit`: ^3.14.0 - Extensions Tiptap de base
- `tiptap-markdown`: ^0.9.0 - Support Markdown
- `lowlight`: ^3.3.0 - Syntax highlighting
- `jszip`: ^3.10.1 - Compression ZIP pour .boardkit
- `marked`: ^17.0.1 - Parsing Markdown
- `vite-plugin-pwa`: ^1.2.0 - PWA support

### UI Dependencies

- `@vueuse/core`: ^10.7.0 - Utilitaires Vue
- `lucide-vue-next`: ^0.562.0 - Icônes

### Platform Dependencies

- `idb`: ^8.0.0 - Wrapper IndexedDB

### Desktop Dependencies

- `@tauri-apps/api`: ^2.0.0 - API Tauri
- `@tauri-apps/plugin-dialog`: ^2.4.2 - Dialogs
- `@tauri-apps/plugin-fs`: ^2.4.4 - File system

### Dev Dependencies

- `vite`: ^5.0.0 - Build tool
- `vue-tsc`: ^1.8.27 - Type checking
- `tailwindcss`: ^3.4.0 - CSS framework
- `autoprefixer`: ^10.4.16 - CSS post-processing
- `postcss`: ^8.4.32 - CSS processing

---

## Workflow de Développement

### Scripts Disponibles

**Root:**

- `pnpm dev` - Lance l'app web en dev
- `pnpm build` - Build toutes les apps
- `pnpm lint` - Lint le code
- `pnpm typecheck` - Vérification TypeScript
- `pnpm desktop` - Lance l'app desktop (Tauri)

**Web:**

- `pnpm dev` - Dev server (Vite)
- `pnpm build` - Build production
- `pnpm preview` - Preview du build

**Desktop:**

- `pnpm tauri dev` - Dev avec Tauri
- `pnpm tauri build` - Build production

### Workspace

- Monorepo pnpm avec workspace
- Packages internes: `workspace:*`
- Node >= 18, pnpm >= 8

---

## Fonctionnalités Implémentées

### ✅ Canvas

- [x] Canvas infini avec pan/zoom
- [x] Grid background avec parallaxe
- [x] Zoom vers le curseur
- [x] Pan avec scroll, molette, ou Espace+drag
- [x] Indicateur de zoom (pourcentage)

### ✅ Widgets

- [x] Ajout de widgets
- [x] Déplacement (drag & drop)
- [x] Redimensionnement (coin inférieur droit)
- [x] Sélection (clic)
- [x] Suppression (Delete ou bouton)
- [x] Duplication (Cmd+D)
- [x] Z-index management (sélection = premier plan)
- [x] Nudge avec flèches (1px ou 10px)

### ✅ Modules

- [x] Module Text (éditeur Markdown riche)
- [x] Module Todo (liste de tâches)
- [x] Système de modules extensible
- [x] Enregistrement de modules
- [x] Sérialisation/désérialisation

### ✅ Persistance

- [x] Autosave (500ms debounce)
- [x] IndexedDB storage (web)
- [x] Filesystem storage (desktop)
- [x] Historique (undo/redo)
- [x] Import/Export .boardkit
- [x] Liste de documents
- [x] Restauration du dernier document

### ✅ UI/UX

- [x] Command Palette (Cmd+K)
- [x] Context Menus (clic droit)
- [x] Raccourcis clavier complets
- [x] Toolbar avec actions principales
- [x] Settings Panel pour widgets
- [x] Thème light/dark
- [x] Design system complet
- [x] Composants UI réutilisables

### ✅ Actions

- [x] Système d'actions unifié
- [x] Actions core (board, widget, view)
- [x] Actions dynamiques par module
- [x] Recherche fuzzy dans palette
- [x] Groupement par catégories
- [x] Conditions `when` pour disponibilité

---

## Limitations et Non-Goals (V0)

### Explicitement Exclus

- ❌ Dessin à main levée (freehand drawing)
- ❌ Collaboration multi-utilisateur
- ❌ Comptes ou permissions
- ❌ Chiffrement
- ❌ Synchronisation automatique
- ❌ Backend de recherche avancé
- ❌ Résolution de conflits automatique (fichiers dupliqués)

### Limitations Actuelles

- Sélection unique seulement (pas de multi-sélection)
- Pas de groupement de widgets
- Pas d'alignement automatique
- Pas de grille de snap
- Pas de copier/coller (seulement duplication)
- Pas de recherche dans le contenu des widgets
- Pas de templates de widgets
- Pas de plugins tiers

---

## Points d'Extension Futurs

### Architecture Prête Pour

1. **Nouveaux Modules**

   - Créer un nouveau dossier dans `modules/`
   - Définir avec `defineModule()`
   - Enregistrer dans `registerModules()`

2. **Nouvelles Actions**

   - Ajouter dans `coreActions.ts` ou créer un nouveau fichier
   - Enregistrer via `actionRegistry.register()`

3. **Nouveaux Composants UI**

   - Ajouter dans `packages/ui/src/components/`
   - Exporter dans `packages/ui/src/index.ts`

4. **Nouvelles Plateformes**
   - Créer un nouvel `app/`
   - Implémenter les adaptateurs platform nécessaires

---

## Structure des Fichiers Clés

### Core

- `packages/core/src/stores/boardStore.ts` - Store principal
- `packages/core/src/modules/ModuleRegistry.ts` - Registre de modules
- `packages/core/src/modules/defineModule.ts` - API de définition
- `packages/core/src/actions/ActionRegistry.ts` - Registre d'actions
- `packages/core/src/actions/coreActions.ts` - Actions core
- `packages/core/src/types/document.ts` - Types du document
- `packages/core/src/types/module.ts` - Types des modules
- `packages/core/src/types/action.ts` - Types des actions

### UI

- `packages/ui/src/components/WidgetFrame.vue` - Conteneur de widget
- `packages/ui/src/components/command/` - Composants Command Palette
- `packages/ui/DESIGN_SYSTEM.md` - Documentation du design system

### Web

- `apps/web/src/pages/Board.vue` - Page principale
- `apps/web/src/components/BoardCanvas.vue` - Canvas
- `apps/web/src/components/Toolbar.vue` - Toolbar
- `apps/web/src/components/CommandPalette.vue` - Command Palette
- `apps/web/src/components/SettingsPanel.vue` - Settings Panel
- `apps/web/src/composables/usePersistence.ts` - Persistance
- `apps/web/src/modules/` - Modules (text, todo)

### Desktop

- `apps/desktop/src/App.vue` - App principale
- `apps/desktop/src-tauri/` - Backend Rust/Tauri

### Platform

- `packages/platform/src/storage/indexeddb.ts` - Storage IndexedDB
- `packages/platform/src/storage/types.ts` - Types storage

---

## Notes de Développement

### Bonnes Pratiques

1. **Modules**

   - Toujours utiliser `defineModule()` pour créer un module
   - Ne jamais accéder à l'état d'autres modules
   - Utiliser `WidgetFrame` pour le drag/resize
   - Sérialiser complètement l'état

2. **Actions**

   - Utiliser le système d'actions pour toutes les opérations utilisateur
   - Ne pas dupliquer la logique entre palette/menus/shortcuts
   - Utiliser `when` pour les conditions de disponibilité

3. **State**

   - Utiliser `boardStore` pour toutes les modifications du document
   - Marquer comme `dirty` après chaque modification
   - Utiliser `updateModuleState` pour les mises à jour partielles

4. **UI**

   - Utiliser les composants `@boardkit/ui` quand possible
   - Suivre le design system (tokens sémantiques)
   - Densité compacte par défaut

5. **Storage**
   - Utiliser les adaptateurs platform (pas d'API directe)
   - Gérer l'historique via `historyStorage`
   - Autosave automatique (pas besoin d'appel manuel)

---

## État du Code

### Qualité

- ✅ TypeScript strict
- ✅ Composants Vue 3 Composition API
- ✅ Architecture modulaire claire
- ✅ Séparation des responsabilités
- ✅ Design system documenté
- ✅ Code bien structuré

### Tests

- ⚠️ Pas de tests unitaires actuellement
- ⚠️ Pas de tests d'intégration
- ⚠️ Tests manuels uniquement

### Documentation

- ✅ README.md complet
- ✅ ARCHITECTURE.md
- ✅ SPECS_V0.md
- ✅ DESIGN_SYSTEM.md
- ⚠️ Pas de JSDoc dans le code
- ⚠️ Pas de guides de contribution détaillés

---

## Conclusion

Boardkit est une application whiteboard modulaire bien architecturée, avec une base solide pour l'extension future. L'application respecte les spécifications V0 et fournit une expérience utilisateur fluide avec un système de modules extensible et un design system cohérent.

L'architecture monorepo permet une séparation claire entre la logique métier (core), l'UI (ui), et les adaptateurs plateforme (platform), facilitant la maintenance et l'extension.

**Points Forts:**

- Architecture modulaire claire
- Système d'actions unifié
- Design system complet
- Offline-first bien implémenté
- Code TypeScript strict

**Améliorations Possibles:**

- Ajout de tests
- Documentation JSDoc
- Performance optimizations (virtualization pour beaucoup de widgets)
- Plus de modules (images, diagrammes, etc.)

---

_Document généré automatiquement par analyse de la codebase_
