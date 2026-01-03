# /project:style — Ajustements UI/UX

Tu fais des ajustements **VISUELS/UI**.

## Contexte requis
- Skill: `boardkit-design-system`
- Fichiers UI concernés

## Règles strictes

1. **UNIQUEMENT** les tokens du design system
2. **Pas** de valeurs magiques (px hardcodés)
3. **Vérifier** dans Playground après modification

## Tokens disponibles

### Heights
- `h-7` (28px) — small
- `h-8` (32px) — default
- `h-9` (36px) — large

### Paddings
- `p-1.5`, `p-2`, `p-2.5`, `p-3`

### Gaps
- `gap-1`, `gap-1.5`, `gap-2`

### Colors
- `primary`, `muted`, `destructive`, `accent`

## Workflow

1. **Identifie** les composants à modifier
2. **Modifie** en utilisant les tokens
3. **Vérifie** dans Playground
4. **Land**: `/project:land`

## Agent
Délègue à `design-system-guardian` si changement significatif.

## Argument
$ARGUMENTS = Description de l'ajustement visuel
