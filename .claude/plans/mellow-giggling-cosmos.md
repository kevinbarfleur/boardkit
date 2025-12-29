# Plan d'Action - Refactoring Architecture Boardkit

## Contexte

Suite à l'audit architecture, 5 points d'amélioration ont été identifiés. Ce plan détaille l'implémentation de chacun, en commençant par la globalisation des modules (priorité utilisateur).

---

## Point 1 : Globalisation des Modules et Composants Partagés

### Analyse de la Duplication

**18 fichiers 100% identiques** entre `apps/web/` et `apps/desktop/`:
- Tous les modules : `todo/`, `text/` (types + index), `task-radar/`, `focus-lens/`
- Composants : `CanvasElementsLayer.vue`, `SettingsPanel.vue`, `ToolToolbar.vue`
- Composables : `useDataSharingUI.ts`, `useSettingsPanel.ts`

**Fichiers avec différences mineures** (1-2 lignes):
- `BoardCanvas.vue` : `platform: 'web'` vs `platform: 'desktop'`
- `CommandPalette.vue` : idem
- `Toolbar.vue` : import différent pour `HistoryEntry`

**Fichiers vraiment différents** (à garder séparés):
- `App.vue` : Tauri events vs RouterView
- `usePersistence.ts` : IndexedDB vs Tauri FS
- `boardkitFile.ts` : JSZip vs Tauri plugins
- `TextWidget.vue` : Tiptap (web) vs textarea simple (desktop)

### Plan d'Implémentation

```
□ Phase 1.1 : Créer le package partagé
  □ Créer packages/app-common/
  □ Configurer package.json avec exports
  □ Ajouter au workspace pnpm

□ Phase 1.2 : Migrer les modules (impact minimal)
  □ Déplacer apps/web/src/modules/* → packages/app-common/modules/
  □ Garder TextWidget.vue dans chaque app (différent)
  □ Exporter depuis packages/app-common/index.ts
  □ Mettre à jour imports dans apps/web et apps/desktop

□ Phase 1.3 : Migrer les composants partagés
  □ Déplacer CanvasElementsLayer.vue
  □ Déplacer SettingsPanel.vue
  □ Déplacer ToolToolbar.vue
  □ Pour BoardCanvas.vue et CommandPalette.vue:
    - Ajouter prop `platform: 'web' | 'desktop'`
    - Déplacer vers app-common
    - Injecter platform depuis chaque app

□ Phase 1.4 : Migrer les composables partagés
  □ Déplacer useDataSharingUI.ts
  □ Déplacer useSettingsPanel.ts
  □ Mettre à jour les imports

□ Phase 1.5 : Nettoyage
  □ Supprimer les fichiers dupliqués dans apps/
  □ Vérifier les builds web et desktop
  □ Vérifier les tests
```

### Structure Finale

```
packages/
├── core/           # Existant
├── ui/             # Existant
├── platform/       # Existant
└── app-common/     # NOUVEAU - @boardkit/app-common
    ├── package.json
    ├── src/
    │   ├── index.ts
    │   ├── modules/
    │   │   ├── index.ts
    │   │   ├── todo/
    │   │   ├── text/           # Avec TiptapEditor (unifié)
    │   │   ├── task-radar/
    │   │   └── focus-lens/
    │   ├── components/
    │   │   ├── BoardCanvas.vue
    │   │   ├── CanvasElementsLayer.vue
    │   │   ├── CommandPalette.vue
    │   │   ├── SettingsPanel.vue
    │   │   ├── ToolToolbar.vue
    │   │   └── TiptapEditor.vue  # Partagé (était web-only)
    │   └── composables/
    │       ├── useDataSharingUI.ts
    │       └── useSettingsPanel.ts
    └── tsconfig.json
```

### Note : Unification TextWidget avec Tiptap

Le module Text utilisera Tiptap pour les deux plateformes :
- Desktop abandonne le textarea simple
- TiptapEditor.vue sera dans app-common
- Dépendance @tiptap/* ajoutée à app-common

**Effort estimé** : 4-5 heures (+ migration Tiptap desktop)
**Risque** : Faible (déplacement de fichiers, pas de changement de logique)

---

## Point 2 : Tests sur les Systèmes Critiques

### État Actuel

**Testé** (bien couvert):
- `ActionRegistry.test.ts` (458 lignes, 30+ tests)
- `DataBus.test.ts` (263 lignes, 28+ tests)
- `migrations.test.ts` (222 lignes, 20+ tests)

**Non testé** (critique):
- `boardStore.ts` (1,144 lignes) - 0%
- `DataAccessController.ts` (162 lignes) - 0%

### Plan d'Implémentation

```
□ Phase 2.1 : Tests boardStore - CRUD Widgets
  □ Test: addWidget() crée un widget avec moduleId correct
  □ Test: addWidget() génère un ID unique
  □ Test: addWidget() positionne au centre du viewport
  □ Test: removeWidget() supprime le widget
  □ Test: removeWidget() supprime l'état module associé
  □ Test: removeWidget() nettoie les permissions data sharing
  □ Test: moveWidget() met à jour x, y
  □ Test: resizeWidget() respecte minWidth/minHeight
  □ Test: duplicateWidget() crée une copie avec nouvel ID

□ Phase 2.2 : Tests boardStore - Sélection
  □ Test: selectWidget() sélectionne un widget
  □ Test: selectWidget() désélectionne le précédent
  □ Test: selectElement() sélectionne un élément
  □ Test: selectMultiple() avec types mixtes
  □ Test: clearSelection() vide la sélection
  □ Test: isSelected() retourne le bon état
  □ Test: deleteSelection() supprime les items sélectionnés

□ Phase 2.3 : Tests boardStore - État et Dirty
  □ Test: markDirty() met isDirty à true
  □ Test: markDirty() stocke lastAction
  □ Test: markClean() remet isDirty à false
  □ Test: mutations appellent markDirty automatiquement

□ Phase 2.4 : Tests DataAccessController
  □ Test: checkAccess() retourne false sans permission
  □ Test: checkAccess() retourne true avec permission valide
  □ Test: getConnectionStatus() retourne 'connected' si provider existe
  □ Test: getConnectionStatus() retourne 'broken' si provider supprimé
  □ Test: createPermission() génère ID et timestamp
  □ Test: findPermission() trouve par consumer-provider-contract
  □ Test: getAvailableProviders() filtre par contractId
```

### Fichiers à Créer

```
packages/core/__tests__/
├── ActionRegistry.test.ts    # Existant
├── DataBus.test.ts           # Existant
├── migrations.test.ts        # Existant
├── boardStore.test.ts        # NOUVEAU (~300 lignes)
└── DataAccessController.test.ts  # NOUVEAU (~150 lignes)
```

**Effort estimé** : 4-6 heures
**Risque** : Nul (ajout pur)

---

## Point 3 : Correction des `as any`

### Occurrences Identifiées

**8 occurrences** dans 4 fichiers (dupliqués web/desktop):

| Fichier | Ligne | Code |
|---------|-------|------|
| `ToolToolbar.vue` | 55 | `(selectedElement.value as any).fontSize` |
| `ToolToolbar.vue` | 62 | `(selectedElement.value as any).textAlign` |
| `ToolToolbar.vue` | 69 | `(selectedElement.value as any).fontWeight` |
| `ToolToolbar.vue` | 76 | `(selectedElement.value as any).fontFamily` |
| `BoardCanvas.vue` | 790 | `(element as any).content` |
| `BoardCanvas.vue` | 792 | `(element as any).label` |

### Plan d'Implémentation

```
□ Phase 3.1 : Vérifier les type guards existants
  □ Lire packages/core/src/types/element.ts
  □ Vérifier si isTextElement, isShapeElement existent
  □ Si non, les créer

□ Phase 3.2 : Corriger ToolToolbar.vue
  □ Importer les type guards depuis @boardkit/core
  □ Remplacer les 4 occurrences avec type guards:

    // Avant
    return (selectedElement.value as any).fontSize ?? 16

    // Après
    if (selectedElement.value && isTextElement(selectedElement.value)) {
      return selectedElement.value.fontSize ?? 16
    }
    return 16

□ Phase 3.3 : Corriger BoardCanvas.vue
  □ Même pattern pour les 2 occurrences

□ Phase 3.4 : Si Point 1 fait, corriger une seule fois
  □ Sinon corriger dans web ET desktop
```

**Effort estimé** : 30-45 minutes
**Risque** : Nul

---

## Point 4 : Validation à l'Import des Documents

### Problème

Un fichier `.boardkit` corrompu peut crasher l'application. Aucune validation n'est faite avant de parser le JSON.

### Plan d'Implémentation

```
□ Phase 4.1 : Créer le validateur
  □ Créer packages/core/src/validation/documentValidator.ts
  □ Implémenter validateDocument(data: unknown): BoardkitDocument
  □ Vérifier: version (number), meta (object), board (object), modules (object)
  □ Retourner des erreurs explicites

□ Phase 4.2 : Intégrer dans le flux d'import
  □ Modifier apps/web/src/utils/boardkitFile.ts
  □ Modifier apps/desktop/src/utils/boardkitFile.ts
  □ Appeler validateDocument() après JSON.parse()

□ Phase 4.3 : Gestion d'erreur UI
  □ Afficher un message user-friendly si validation échoue
  □ Ne pas crasher l'app
```

### Code du Validateur

```typescript
// packages/core/src/validation/documentValidator.ts
export class DocumentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocumentValidationError'
  }
}

export function validateDocument(data: unknown): BoardkitDocument {
  if (!data || typeof data !== 'object') {
    throw new DocumentValidationError('Document invalide: objet attendu')
  }

  const doc = data as Record<string, unknown>

  if (typeof doc.version !== 'number') {
    throw new DocumentValidationError('Document invalide: version manquante ou invalide')
  }

  if (!doc.meta || typeof doc.meta !== 'object') {
    throw new DocumentValidationError('Document invalide: meta manquant')
  }

  if (!doc.board || typeof doc.board !== 'object') {
    throw new DocumentValidationError('Document invalide: board manquant')
  }

  if (!doc.modules || typeof doc.modules !== 'object') {
    throw new DocumentValidationError('Document invalide: modules manquant')
  }

  // Validation plus fine si nécessaire
  const board = doc.board as Record<string, unknown>
  if (!Array.isArray(board.widgets)) {
    throw new DocumentValidationError('Document invalide: widgets doit être un tableau')
  }
  if (!Array.isArray(board.elements)) {
    throw new DocumentValidationError('Document invalide: elements doit être un tableau')
  }

  return data as BoardkitDocument
}
```

**Effort estimé** : 1-2 heures
**Risque** : Très faible

---

## Point 5 : Décomposition boardStore

### Objectif

Extraire la logique de data sharing dans un store séparé pour :
- Réduire la taille de boardStore (1,144 → ~950 lignes)
- Isoler la logique de permissions
- Faciliter les tests du data sharing

### Responsabilités à Extraire

**Vers `dataSharingStore.ts`** (~200 lignes):
- `grantDataPermission()`
- `revokeDataPermission()`
- `revokeDataPermissionByLink()`
- `getConsumerPermissions()`
- `getProviderPermissions()`
- `getAvailableProviders()`
- `cleanupWidgetDataSharing()`
- Computed: `dataSharing`, `permissions`, `dataLinks`

### Plan d'Implémentation

```
□ Phase 5.1 : Créer dataSharingStore.ts
  □ Créer packages/core/src/stores/dataSharingStore.ts
  □ Définir le store avec les fonctions extraites
  □ Importer boardStore pour accéder aux widgets (dépendance)

□ Phase 5.2 : Adapter boardStore
  □ Supprimer les fonctions data sharing de boardStore
  □ Garder les appels à cleanupWidgetDataSharing dans removeWidget
  □ Utiliser dataSharingStore pour la coordination

□ Phase 5.3 : Mettre à jour les imports
  □ Chercher tous les usages de grantDataPermission, etc.
  □ Mettre à jour vers dataSharingStore
  □ Fichiers concernés:
    - apps/web/src/composables/useDataSharingUI.ts
    - apps/desktop/src/composables/useDataSharingUI.ts
    - apps/web/src/components/SettingsPanel.vue
    - apps/desktop/src/components/SettingsPanel.vue

□ Phase 5.4 : Tests
  □ Créer packages/core/__tests__/dataSharingStore.test.ts
  □ Tester les permissions CRUD
  □ Tester le cleanup

□ Phase 5.5 : Vérification
  □ Build web et desktop
  □ Tests passent
  □ Data sharing fonctionne dans l'app
```

### Structure du Store

```typescript
// packages/core/src/stores/dataSharingStore.ts
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useBoardStore } from './boardStore'
import { dataAccessController } from '../data/DataAccessController'

export const useDataSharingStore = defineStore('dataSharing', () => {
  const boardStore = useBoardStore()

  // Accès aux données du document
  const dataSharing = computed(() => boardStore.document?.dataSharing)
  const permissions = computed(() => dataSharing.value?.permissions ?? [])
  const dataLinks = computed(() => dataSharing.value?.links ?? [])

  // Mutations
  function grantDataPermission(consumerWidgetId, providerWidgetId, contractId) { ... }
  function revokeDataPermission(permissionId) { ... }
  function revokeDataPermissionByLink(consumerWidgetId, providerWidgetId, contractId) { ... }
  function cleanupWidgetDataSharing(widgetId) { ... }

  // Queries
  function getConsumerPermissions(widgetId) { ... }
  function getProviderPermissions(widgetId) { ... }
  function getAvailableProviders(contractId, excludeWidgetId?) { ... }

  return {
    dataSharing, permissions, dataLinks,
    grantDataPermission, revokeDataPermission, revokeDataPermissionByLink,
    cleanupWidgetDataSharing,
    getConsumerPermissions, getProviderPermissions, getAvailableProviders,
  }
})
```

**Effort estimé** : 3-4 heures
**Risque** : Moyen (changement structurel, mais logique isolée)

---

## Ordre d'Exécution Recommandé

```
1. Point 1 : Globalisation des modules     [4-5h]  ← Priorité utilisateur + Tiptap
2. Point 3 : Correction as any             [30min] ← Quick win, bénéficie du Point 1
3. Point 4 : Validation import             [1-2h]  ← Protection importante
4. Point 5 : Décomposition boardStore      [3-4h]  ← Avant les tests
5. Point 2 : Tests critiques               [4-6h]  ← Inclut nouveau dataSharingStore
```

**Temps total estimé** : 13-18 heures

---

## Fichiers Critiques à Modifier

### Point 1
- Créer `packages/app-common/` (nouveau package)
- Modifier `apps/web/src/modules/` (supprimer, importer)
- Modifier `apps/desktop/src/modules/` (supprimer, importer)
- Modifier `pnpm-workspace.yaml` si nécessaire

### Point 2
- Créer `packages/core/__tests__/boardStore.test.ts`
- Créer `packages/core/__tests__/DataAccessController.test.ts`

### Point 3
- Modifier `apps/web/src/components/ToolToolbar.vue` (ou app-common après Point 1)
- Modifier `apps/web/src/components/BoardCanvas.vue` (ou app-common après Point 1)

### Point 4
- Créer `packages/core/src/validation/documentValidator.ts`
- Modifier `apps/web/src/utils/boardkitFile.ts`
- Modifier `apps/desktop/src/utils/boardkitFile.ts`
