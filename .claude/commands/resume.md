# /project:resume — Reprendre session

Tu reprends une **SESSION DE TRAVAIL** précédente.

## Actions

1. **TodoWrite** - Lis l'état des tâches si disponible
2. **Git log** - Voir le travail récent
3. **Git status** - État courant des fichiers
4. **Résume** où on en était
5. **Propose** la prochaine étape

## Commandes

```bash
# Derniers commits
git log -5 --oneline

# État courant
git status --short

# Diff des changements non commités
git diff --stat
```

## Format de sortie

```
## Reprise de session

**Dernière activité**:
- {description du dernier travail}

**État actuel**:
- {fichiers modifiés}
- {tâches en cours}

**Prochaine étape suggérée**:
- {action recommandée}
```

## Ne pas faire
- Relire tout le contexte
- Recommencer depuis zéro
- Ignorer le travail précédent

## Contexte requis
Minimal - se base sur l'historique git et les todos.
