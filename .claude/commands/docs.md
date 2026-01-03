# /project:docs — Documentation

Tu mets à jour la **DOCUMENTATION**.

## Agent

Invoque `docs-scribe` pour:
- Vérifier la cohérence
- Mettre à jour les fichiers obsolètes
- Ajouter ce qui manque

## Fichiers prioritaires

| Fichier | Contenu |
|---------|---------|
| `README.md` | Quick start, features |
| `ARCHITECTURE.md` | Design système |
| `CONTRIBUTING.md` | Workflow dev |
| `packages/ui/DESIGN_SYSTEM.md` | Composants UI |

## Checklist d'audit

### Accuracy
- [ ] Paths mentionnés existent
- [ ] Commandes fonctionnent
- [ ] Stack à jour (Vue 3, UnoCSS, Vitest)
- [ ] Version document = code (v2)

### Legacy
- [ ] Pas de références obsolètes
- [ ] Pas de TODOs complétés
- [ ] Pas de "temporaire" permanent

### Completeness
- [ ] Features V0 documentées
- [ ] Modules décrits
- [ ] Shortcuts listés

## Quand lancer

- Après changements significatifs
- Après migrations (ex: Tailwind → UnoCSS)
- Avant releases
- Check périodique

## Argument
$ARGUMENTS = Focus spécifique ou "audit" pour check complet
