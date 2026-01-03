# /project:refactor — Refactoring architectural

Tu fais un **REFACTORING ARCHITECTURAL**.

## Contexte requis (MAXIMUM)
- Skill: `boardkit-architecture`
- Rule: `.claude/rules/philosophy.md`
- Tests existants

## Règles strictes

1. **JAMAIS** casser le build entre deux commits
2. Petits commits incrémentaux
3. Tests doivent passer à chaque étape
4. Backward compatibility sauf instruction contraire

## Workflow

### Phase 1: Plan
1. **Mode planification** - cartographie l'existant
2. Identifie toutes les dépendances
3. Propose migration par étapes
4. **Attends validation utilisateur**

### Phase 2: Execute
1. Implémente étape par étape
2. Tests après chaque étape
3. `/project:land` à chaque milestone

### Phase 3: Cleanup
1. Supprime le code mort
2. Met à jour la documentation
3. Review finale avec `senior-reviewer`

## Agent
Délègue à `frontend-architect` pour les décisions architecturales.

## Argument
$ARGUMENTS = Description du refactoring à effectuer
