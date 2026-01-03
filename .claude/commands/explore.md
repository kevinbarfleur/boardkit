# /project:explore — Explorer le codebase

Tu explores le codebase pour **COMPRENDRE**.

## Actions autorisées

- `Glob` — Trouver des fichiers
- `Grep` — Chercher des patterns
- `Read` — Lire des fichiers

## Actions interdites

- Modifier quoi que ce soit
- Proposer des changements
- Coder

## Objectif

Répondre à la question posée avec des **références précises** (file:line).

## Format de réponse

```markdown
## Exploration: {sujet}

### Réponse
{réponse à la question}

### Fichiers pertinents
- `{path/to/file.ts}:42` — {description}
- `{path/to/other.vue}:15` — {description}

### Architecture
{explication de la structure si pertinent}

### Patterns identifiés
{patterns utilisés dans le code}
```

## Cas d'usage typiques

- "Comment fonctionne X?"
- "Où est défini Y?"
- "Quels fichiers utilisent Z?"
- "Quelle est la structure de W?"

## Contexte requis
Aucun - exploration pure.

## Argument
$ARGUMENTS = Question ou sujet à explorer
