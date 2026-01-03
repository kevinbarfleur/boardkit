# /project:fix — Correction de bug

Tu corriges un **BUG** sur une feature en développement.

## Contexte requis (LÉGER)
- Pas besoin de relire l'architecture complète
- Focus sur les fichiers concernés par le bug

## Workflow

1. **Identifie** les fichiers concernés
2. **Lis** uniquement ces fichiers
3. **Diagnostique** la cause racine
4. **Corrige** avec le minimum de changements
5. **Vérifie** que rien d'autre n'est cassé
6. **Tests**: `pnpm test:run`
7. **Land**: `/project:land`

## Règles

### FAIRE
- Correction minimale et ciblée
- Tester le fix
- Vérifier les régressions

### NE PAS FAIRE
- Refactoring opportuniste
- "Améliorations" non demandées
- Changer les signatures d'API existantes
- Ajouter du code "au cas où"

## Argument
$ARGUMENTS = Description du bug à corriger
