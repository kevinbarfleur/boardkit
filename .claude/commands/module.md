# /project:module — Nouveau module/widget

Tu crées un **NOUVEAU MODULE** pour Boardkit.

## Contexte requis (MAXIMUM)
- Skill: `boardkit-architecture`
- Skill: `boardkit-design-system`
- Skill: `boardkit-file-format`

## Structure obligatoire

```
packages/app-common/src/modules/{name}/
├── index.ts          → Module definition + registration
├── types.ts          → State types + contracts
├── {Name}Widget.vue  → Main component
└── components/       → Sub-components (si nécessaire)
```

## Template Module

```typescript
import { defineModule } from '@boardkit/core'
import type { ModuleState } from './types'

export const myModule = defineModule<ModuleState>({
  id: 'my-module',
  displayName: 'My Module',
  icon: 'box', // Vérifier existence Lucide!
  category: 'productivity',
  defaultWidth: 300,
  defaultHeight: 200,
  minWidth: 200,
  minHeight: 150,
  defaultState: () => ({ /* ... */ }),
  serialize: (state) => state,
  deserialize: (data) => data as ModuleState,
  component: () => import('./MyWidget.vue')
})
```

## Checklist

- [ ] `defineModule` avec tous les champs
- [ ] Types serialisables dans `types.ts`
- [ ] Data contracts si provider/consumer
- [ ] Enregistrement dans `ModuleRegistry`
- [ ] UI via `@boardkit/ui` uniquement
- [ ] Icon Lucide vérifié

## Agent
Délègue à `module-integrator` pour l'intégration.

## Argument
$ARGUMENTS = Description du module à créer
