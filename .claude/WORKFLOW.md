# Boardkit — Workflow Claude Code

Guide d'utilisation quotidienne des commandes et du workflow agentique.

---

## Quick Reference

| Situation | Commande |
|-----------|----------|
| Nouvelle feature | `/project:feature` |
| Bug sur feature en cours | `/project:fix` |
| Correction urgente | `/project:hotfix` |
| Améliorer feature existante | `/project:enhance` |
| Ajustement visuel | `/project:style` |
| Renommage/typo | `/project:typo` |
| Refactoring | `/project:refactor` |
| Nouveau module | `/project:module` |
| Ajouter des tests | `/project:test` |
| Finaliser + commit | `/project:land` |
| Lancer review | `/project:review` |
| État du repo | `/project:status` |
| Reprendre session | `/project:resume` |
| Planifier sans coder | `/project:plan` |
| Explorer le code | `/project:explore` |
| Mettre à jour docs | `/project:docs` |

---

## Scénarios Quotidiens

### Scénario 1: Nouvelle Feature

```
Toi: /project:feature Ajouter un module Pomodoro

Claude:
1. [Plan mode] Analyse l'architecture
2. Propose un plan avec TodoWrite
3. Attend ta validation

Toi: OK, c'est bon

Claude:
4. Implémente par étapes
5. Délègue à module-integrator
6. Délègue à design-system-guardian pour l'UI
7. Lance les tests
8. Lance senior-reviewer

Toi: /project:land

Claude:
9. Tests ✅
10. Lint ✅
11. Commit + push
```

**Temps estimé**: 20-60 min selon complexité

---

### Scénario 2: Fixer un Bug

```
Toi: /project:fix Le widget Todo ne se redimensionne pas correctement

Claude:
1. Lit les fichiers concernés (TodoWidget, WidgetFrame)
2. Identifie le problème
3. Corrige de manière minimale
4. Vérifie que rien d'autre ne casse
5. Propose le fix

Toi: /project:land
```

**Temps estimé**: 5-15 min

---

### Scénario 3: Hotfix Urgent

```
Toi: /project:hotfix L'app crash au démarrage si pas de document

Claude:
1. Localise le fichier exact
2. Lit UNIQUEMENT ce fichier
3. Corrige en 1-2 lignes
4. Commit immédiat: "fix: handle missing document on startup"
```

**Temps estimé**: 2-5 min

---

### Scénario 4: Reprendre le Travail

```
Toi: /project:resume

Claude:
Dernière activité: Implémentation module Pomodoro
État: 3 fichiers modifiés non commités
Tâches restantes:
- [ ] Ajouter les tests
- [ ] Review senior

Prochaine étape: Compléter les tests

Toi: OK continue

Claude: [Reprend le travail]
```

---

### Scénario 5: Explorer avant de Coder

```
Toi: /project:explore Comment fonctionne le data sharing entre modules?

Claude:
## Exploration: Data Sharing

### Réponse
Le data sharing utilise DataBus pour le pub/sub runtime...

### Fichiers pertinents
- `packages/core/src/types/dataContract.ts:12` — Définition contracts
- `packages/core/src/bus/DataBus.ts:45` — Implémentation pub/sub
- `packages/app-common/src/modules/todo/index.ts:67` — Exemple provider

### Pattern
1. Provider publie via useProvideData()
2. Consumer souscrit via useConsumeData()
3. DataBus route les données
```

---

### Scénario 6: Session de Refactoring

```
Toi: /project:plan Extraire la logique de persistence du boardStore

Claude:
## Plan: Extraction Persistence

### Approche
1. Créer usePersistence composable
2. Migrer logique autosave
3. Migrer logique dirty state
4. Mettre à jour boardStore
5. Tests

### Risques
- Régression autosave
- Impact sur desktop

Toi: OK, go

Toi: /project:refactor Extraire la logique de persistence

Claude: [Exécute le plan étape par étape]
```

---

## Bonnes Pratiques

### 1. Choisir la Bonne Commande

| Si... | Alors... |
|-------|----------|
| Nouvelle fonctionnalité | `/project:feature` |
| Bug sur travail en cours | `/project:fix` |
| Bug production urgent | `/project:hotfix` |
| Amélioration mineure | `/project:enhance` |
| Juste du visuel | `/project:style` |
| Changement architectural | `/project:refactor` |

### 2. Utiliser le Bon Niveau de Contexte

| Commande | Contexte | Usage |
|----------|----------|-------|
| `feature`, `refactor`, `module` | MAXIMUM | Travail complexe |
| `enhance`, `fix`, `style` | MOYEN | Travail ciblé |
| `hotfix`, `typo`, `test` | LÉGER | Corrections rapides |
| `land`, `status`, `explore` | MINIMAL | Opérations |

### 3. Workflow Type par Journée

```
# Matin - Reprise
/project:resume

# Travail principal
/project:feature ...
# ou
/project:fix ...

# Validation
/project:review

# Fin de session
/project:land
```

### 4. Gestion du Contexte

```
# Si contexte > 50%
/clear

# Puis reprendre
/project:resume
```

### 5. Quand Utiliser Plan Mode

- Feature complexe touchant plusieurs domaines
- Refactoring avec beaucoup de dépendances
- Incertitude sur l'approche
- Besoin de validation avant de commencer

---

## Commandes par Niveau de Contexte

### 🔴 Contexte Maximum (~3000 tokens)

Ces commandes chargent tout le contexte nécessaire pour un travail complexe:

- `/project:feature` — Nouvelle fonctionnalité
- `/project:refactor` — Refactoring architectural
- `/project:module` — Nouveau module

**Quand utiliser**: Travail qui touche plusieurs fichiers/domaines

### 🟠 Contexte Moyen (~1500 tokens)

Contexte ciblé sur une zone spécifique:

- `/project:enhance` — Amélioration existante
- `/project:fix` — Bug correction
- `/project:style` — Ajustements UI

**Quand utiliser**: Travail localisé à une feature

### 🟡 Contexte Léger (~800 tokens)

Minimum de contexte pour actions rapides:

- `/project:hotfix` — Fix urgent
- `/project:typo` — Renommages
- `/project:test` — Tests

**Quand utiliser**: Corrections simples et isolées

### 🟢 Contexte Minimal (~500 tokens)

Opérations sans besoin de comprendre l'architecture:

- `/project:land` — Commit
- `/project:review` — Review
- `/project:status` — État
- `/project:resume` — Reprise

**Quand utiliser**: Actions opérationnelles

---

## Agents Automatiques

Certains agents sont invoqués automatiquement:

| Quand | Agent |
|-------|-------|
| Après feature/fix | `senior-reviewer` |
| Travail UI | `design-system-guardian` |
| Nouveau module | `module-integrator` |
| Tests | `test-runner` |

Tu n'as pas besoin de les appeler explicitement.

---

## Troubleshooting

### "Contexte trop gros"
```
/clear
/project:resume
```

### "Tests échouent dans /project:land"
```
# Corrige le problème
/project:fix [description]
# Puis
/project:land
```

### "Review BLOCKED"
```
# Lis les points soulevés
# Corrige
/project:review
```

### "Perdu dans le code"
```
/project:explore [question]
```
