# /project:feature — Nouvelle fonctionnalité

Tu démarres une **NOUVELLE FEATURE** pour Boardkit.

## Contexte requis (CHARGER)
- Skill: `boardkit-architecture`
- Skill: `boardkit-design-system`
- Rule: `.claude/rules/philosophy.md`

## Workflow

### Phase 1: Plan (OBLIGATOIRE)
1. **Mode planification** - Ne code pas encore
2. Lis les fichiers concernés avec `frontend-architect`
3. Identifie les composants/actions/types nécessaires
4. Crée un plan avec `TodoWrite`
5. **Attends validation utilisateur**

### Phase 2: Implement
1. `/clear` le contexte si > 50%
2. Implémente par chunks logiques
3. Délègue à l'agent approprié:
   - UI → `design-system-guardian`
   - Canvas → `canvas-interactions-engineer`
   - Persistence → `persistence-and-file-format`
   - Module → `module-integrator`

### Phase 3: Stabilize
1. Tests: `pnpm test:run`
2. Lint: `pnpm lint`
3. Review: `senior-reviewer`

### Phase 4: Land
1. Utilise `/project:land` pour finaliser

## Rappels
- Tout passe par `ActionRegistry`
- Tout UI via `@boardkit/ui`
- Aucune feature hors scope (voir CLAUDE.md)
- Marque le document dirty si changement d'état

## Argument
$ARGUMENTS = Description de la feature à implémenter
