# /project:typo — Corrections texte/naming

Tu fais une correction de **TEXTE ou NAMING**.

## Contexte requis (MINIMAL)
Aucun contexte particulier nécessaire.

## Actions typiques
- Renommer une variable/fonction
- Corriger une faute d'orthographe
- Mettre à jour un commentaire
- Corriger un label/placeholder

## Workflow

1. **Grep** pour trouver toutes les occurrences
2. **Remplace** avec `replace_all` si pertinent
3. **Vérifie** que le build passe: `pnpm typecheck`
4. **Commit**: `git commit -m "chore: [description]"`

## Format commit
```
chore: rename X to Y
chore: fix typo in [file]
chore: update comment in [file]
```

## Argument
$ARGUMENTS = Description du renommage/correction
