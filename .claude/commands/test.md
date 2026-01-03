# /project:test — Ajout/fix de tests

Tu travailles sur les **TESTS**.

## Contexte requis (LÉGER)
- Fichier à tester
- Tests existants similaires

## Stack

- **Framework**: Vitest + Happy DOM
- **Location**: `packages/core/__tests__/`
- **Utils**: `@vue/test-utils`

## Commandes

```bash
pnpm test:run      # Exécution unique
pnpm test          # Mode watch
pnpm test:coverage # Rapport couverture
pnpm test:ui       # Interface graphique
```

## Patterns

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('ModuleName', () => {
  beforeEach(() => {
    // Setup
  })

  it('should [comportement attendu]', () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected)
  })
})
```

## Règles

1. **Isolation** - Chaque test indépendant
2. **Déterministe** - Pas de dépendance timing/ordre
3. **Nommage clair** - Décrit le comportement, pas l'implémentation

## Agent
Délègue à `test-runner` pour exécution et validation.

## Argument
$ARGUMENTS = Description des tests à ajouter/corriger
