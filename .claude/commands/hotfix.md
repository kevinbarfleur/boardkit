# /project:hotfix — Correction urgente

Tu fais une **CORRECTION URGENTE** et isolée.

## Principe
- Minimum de contexte
- Minimum de changements
- Pas de refactoring
- Commit immédiat

## Workflow

1. **Localise** le fichier exact du problème
2. **Lis** uniquement ce fichier
3. **Corrige** de manière minimale
4. **Test rapide** si applicable
5. **Commit**: `git commit -m "fix: [description]"`

## Interdit
- Lire d'autres fichiers "pour contexte"
- Améliorer le code autour
- Ajouter des features
- Refactoring

## Format commit
```
fix: [description courte du fix]
```

## Argument
$ARGUMENTS = Description du problème urgent à corriger
