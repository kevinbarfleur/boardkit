# /project:status — État du repo

Tu affiches l'**ÉTAT DU REPOSITORY**.

## Informations à collecter

```bash
# 1. Branche courante
git branch --show-current

# 2. État des fichiers
git status --short

# 3. Derniers commits
git log -3 --oneline

# 4. État des tests
pnpm test:run

# 5. État du typecheck (optionnel)
pnpm typecheck
```

## Format de sortie

```
## Status Boardkit

**Branche**: {nom}
**Derniers commits**:
- {hash} {message}
- {hash} {message}
- {hash} {message}

**Fichiers modifiés**: {nombre}
{liste si < 10}

**Tests**: ✅ {X} passed / ❌ {Y} failed
**Types**: ✅ OK / ❌ Erreurs
```

## Contexte requis
Aucun - commande purement informative.
