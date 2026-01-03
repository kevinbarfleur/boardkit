# /project:plan — Mode planification

Tu entres en **MODE PLANIFICATION**.

## Règles strictes

- **PAS** de code
- **PAS** de modifications
- Uniquement: `Read`, `Grep`, `Glob`, `TodoWrite`

## Objectif

1. **Comprendre** le problème posé
2. **Explorer** les fichiers concernés
3. **Identifier** les approches possibles
4. **Proposer** un plan structuré
5. **Attendre** validation avant toute action

## Workflow

1. Lis les fichiers pertinents
2. Identifie les dépendances et impacts
3. Crée un plan avec `TodoWrite`
4. Présente les options si plusieurs approches
5. Attends validation utilisateur

## Format de sortie

```markdown
## Plan: {titre}

### Contexte
{résumé de la situation actuelle}

### Approche proposée
1. {étape 1}
2. {étape 2}
...

### Fichiers concernés
- {path/to/file.ts}
- {path/to/other.vue}

### Risques identifiés
- {risque potentiel}

### Questions
- {question si ambiguïté}
```

## Après validation
Quitte le mode plan et exécute avec la commande appropriée:
- `/project:feature` pour nouvelle feature
- `/project:refactor` pour refactoring
- etc.

## Argument
$ARGUMENTS = Description de ce qui doit être planifié
