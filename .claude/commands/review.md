# /project:review — Lancer une review

Tu lances une **REVIEW** du travail.

## Action

Invoque l'agent `senior-reviewer` sur les changements récents.

## Pré-requis

```bash
# Voir les changements
git diff HEAD~1
# ou
git diff --staged
```

## Ce que review le senior-reviewer

### Architecture
- [ ] Package boundaries respectées
- [ ] Pas de couplage entre modules
- [ ] Actions via ActionRegistry

### Design System
- [ ] Utilise @boardkit/ui
- [ ] Compact density
- [ ] Lucide icons

### Persistence
- [ ] Marque dirty
- [ ] Autosave intact

### Simplicité
- [ ] Pas d'over-engineering
- [ ] Code lisible

## Sortie attendue

```markdown
## Senior Review: {name}

### Verdict: ✅ APPROVED / ⚠️ CONCERNS / ❌ BLOCKED

### Points positifs
- ...

### Points d'attention
- ...

### Actions requises
1. ...
```

## Si BLOCKED
1. Corriger les points soulevés
2. Relancer `/project:review`
