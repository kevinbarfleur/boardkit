# /project:land — Finaliser et commit

Tu finalises le travail en cours.

## Séquence

```bash
# 1. Tests
pnpm test:run

# 2. Lint
pnpm lint

# 3. Typecheck
pnpm typecheck

# 4. Git status
git status

# 5. Add + Commit
git add [fichiers pertinents]
git commit -m "[type]: [description]"

# 6. Push (si demandé)
git push
```

## Types de commit

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement fonctionnel |
| `style` | Changements visuels |
| `test` | Ajout/modification tests |
| `chore` | Maintenance |
| `docs` | Documentation |

## Si échec

1. **Ne pas forcer** le commit
2. **Corriger** le problème identifié
3. **Relancer** `/project:land`

## Format message

```
[type]: [description courte]

[description longue si nécessaire]
```

## Rappel
- Ne PAS inclure les fichiers sensibles (.env, credentials)
- Vérifier le diff avant commit
