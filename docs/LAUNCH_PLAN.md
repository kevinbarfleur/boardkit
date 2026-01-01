# Boardkit — Plan de Lancement Complet

> **Domaine** : boardkit.sh
> **Modèle économique** : Obsidian-style (freemium + licence commerciale)
> **Cible** : Développeurs, indie hackers, créatifs tech
> **Positionnement** : "Le whiteboard offline-first qui t'appartient vraiment"

---

## Table des matières

1. [Vision & Positionnement](#1-vision--positionnement)
2. [Modèle Économique](#2-modèle-économique)
3. [Stratégie Open Source & Licence](#3-stratégie-open-source--licence)
4. [Gestion GitHub & Communauté](#4-gestion-github--communauté)
5. [Roadmap de Lancement](#5-roadmap-de-lancement)
6. [Stratégie Marketing & Build in Public](#6-stratégie-marketing--build-in-public)
7. [Lancement V1](#7-lancement-v1)
8. [Monétisation & Paiements](#8-monétisation--paiements)
9. [Croissance Post-Lancement](#9-croissance-post-lancement)
10. [Métriques & KPIs](#10-métriques--kpis)
11. [Budget & Ressources](#11-budget--ressources)
12. [Risques & Mitigations](#12-risques--mitigations)

---

## 1. Vision & Positionnement

### 1.1 Proposition de valeur unique

**Boardkit** est un toolkit whiteboard **offline-first** et **modulaire** qui se différencie par :

| Différenciateur | Description | vs. Concurrents |
|-----------------|-------------|-----------------|
| **100% Offline** | Fonctionne sans connexion, données locales | Miro/FigJam = cloud obligatoire |
| **Data Ownership** | Format `.boardkit` portable, pas de vendor lock-in | Données exportables, versionables |
| **Modules Productivité** | 11 widgets intégrés (Todo, Timer, Kanban, Habits...) | Excalidraw = dessin uniquement |
| **Data Sharing** | Contrats versionnés entre modules | Unique sur le marché |
| **Open Source** | Code visible, auditable, forkable | Obsidian = fermé |
| **Desktop Native** | App macOS via Tauri | Performance native |

### 1.2 Audience cible

**Persona principal** : Développeur/créatif indie (25-45 ans)
- Valorise la vie privée et la propriété des données
- Utilise déjà des outils comme Obsidian, Notion, Excalidraw
- Travaille souvent offline (avions, cafés, zones blanches)
- Prêt à payer pour des outils qui respectent sa philosophie

**Persona secondaire** : Équipe tech petite/moyenne
- Cherche des alternatives aux SaaS coûteux
- Veut self-host ou contrôler ses données
- Budget limité mais valeur claire

### 1.3 Positionnement concurrentiel

```
                    CLOUD-FIRST                 OFFLINE-FIRST
                         │                           │
    ┌────────────────────┼───────────────────────────┼────────────────────┐
    │                    │                           │                    │
    │   Miro ($10+/mo)   │                           │                    │
E   │   FigJam           │                           │                    │
N   │                    │                           │                    │
T   ├────────────────────┼───────────────────────────┼────────────────────┤
R   │                    │                           │                    │
E   │                    │                           │   ★ BOARDKIT ★     │
P   │                    │       Excalidraw+         │   (offline +       │
R   │                    │       ($6-7/mo)           │    modules +       │
I   │                    │                           │    open source)    │
S   ├────────────────────┼───────────────────────────┼────────────────────┤
E   │                    │                           │                    │
    │                    │       tldraw              │   Obsidian Canvas  │
I   │                    │       (SDK focus)         │   (limité)         │
N   │                    │                           │                    │
D   │                    │                           │                    │
I   │                    │                           │                    │
E   └────────────────────┴───────────────────────────┴────────────────────┘
                    WHITEBOARD SIMPLE          PRODUCTIVITÉ INTÉGRÉE
```

---

## 2. Modèle Économique

### 2.1 Structure de pricing (Modèle Obsidian)

| Tier | Prix | Cible | Inclus |
|------|------|-------|--------|
| **Personnel** | Gratuit | Individus, étudiants, hobbies | Toutes les features, usage non-commercial |
| **Supporter** | 25€+ (one-time) | Early adopters, fans | Badge Discord, accès betas, crédits |
| **Commercial** | 50€/user/an | Entreprises ≥2 personnes | Licence légale, facture, support prioritaire |
| **Sync** *(futur)* | 4€/mois | Tous | Sync E2E entre appareils |

### 2.2 Projection de revenus

#### Année 1 (scénario réaliste)

| Source | Hypothèse | Revenu |
|--------|-----------|--------|
| Supporters | 50 × 25€ | 1,250€ |
| Licences commerciales | 20 × 50€ | 1,000€ |
| Sponsors (GitHub/OC) | 300€/mois × 6 mois | 1,800€ |
| **Total Année 1** | | **4,050€** |

#### Année 2-3 (avec Sync)

| Source | Hypothèse | Revenu |
|--------|-----------|--------|
| Sync | 500 users × 48€/an | 24,000€ |
| Licences commerciales | 100 × 50€ | 5,000€ |
| Sponsors | 500€/mois × 12 | 6,000€ |
| Supporters | 100 × 25€ | 2,500€ |
| **Total Année 2-3** | | **37,500€/an** |

#### Année 3-5 (scale B2B)

| Source | Hypothèse | Revenu |
|--------|-----------|--------|
| Sync | 2,000 users × 48€ | 96,000€ |
| Licences commerciales | 500 × 50€ | 25,000€ |
| SDK Licensing (B2B) | 5 × 10,000€ | 50,000€ |
| Modules Premium | 500 × 36€/an | 18,000€ |
| **Total Année 3-5** | | **189,000€/an** |

---

## 3. Stratégie Open Source & Licence

### 3.1 Choix de licence : AGPL-3.0 + Commercial

**Pourquoi AGPL ?**
- Force le partage des modifications pour les déploiements SaaS
- Protège contre l'exploitation par les cloud providers (AWS, etc.)
- Encourage l'achat de licence commerciale pour les entreprises
- Reste "vraiment" open source (approuvé OSI)

**Structure de licence duale :**

```
┌─────────────────────────────────────────────────────────────────┐
│                         BOARDKIT                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Usage personnel/éducatif     │     Usage commercial          │
│   ────────────────────────     │     ─────────────────          │
│                                │                                │
│   Licence : AGPL-3.0           │     Licence : Commerciale      │
│   Prix : GRATUIT               │     Prix : 50€/user/an         │
│                                │                                │
│   ✓ Toutes les features        │     ✓ Toutes les features     │
│   ✓ Code source visible        │     ✓ Pas d'obligation AGPL   │
│   ✓ Fork autorisé              │     ✓ Facture comptable       │
│   ✓ Modification autorisée     │     ✓ Support prioritaire     │
│                                │                                │
│   Obligation : Si tu modifies  │     Pas d'obligation de       │
│   et déploies → open source    │     partage du code           │
│                                │                                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Fichiers à créer/modifier

**LICENSE** (à la racine) :
```
GNU AFFERO GENERAL PUBLIC LICENSE
Version 3, 19 November 2007
...
```

**COMMERCIAL-LICENSE.md** :
```markdown
# Boardkit Commercial License

## Qui a besoin de cette licence ?

Vous avez besoin d'une licence commerciale si :
- Vous utilisez Boardkit dans un contexte professionnel
- Votre organisation compte 2 personnes ou plus
- Vous ne souhaitez pas respecter les obligations AGPL-3.0

## Prix

50€ par utilisateur par an.

## Acheter

→ https://boardkit.sh/pricing

## Ce qui est inclus

- Utilisation commerciale légale
- Facture pour comptabilité
- Support email prioritaire (réponse sous 48h)
- Accès aux betas

## Contact

Pour les licences volume (10+ users) : kevin@boardkit.sh
```

### 3.3 CLA (Contributor License Agreement)

**Obligatoire** pour pouvoir vendre des licences commerciales.

Utiliser [CLA Assistant](https://cla-assistant.io/) (gratuit) :
1. Créer un fichier `CLA.md` dans le repo
2. Configurer CLA Assistant sur le repo GitHub
3. Les contributeurs signent automatiquement via GitHub

**Texte du CLA simplifié :**
```markdown
# Contributor License Agreement

En soumettant du code à Boardkit, vous acceptez :

1. De céder les droits d'auteur de votre contribution à Kevin Barfleur
2. Que votre contribution puisse être distribuée sous AGPL-3.0
   ET sous licence commerciale
3. Que vous avez le droit légal de faire cette contribution

Signature : [automatique via GitHub]
```

---

## 4. Gestion GitHub & Communauté

### 4.1 Structure du repository

```
github.com/kevinbarfleur/boardkit
│
├── README.md                    # Pitch + screenshots + badges
├── LICENSE                      # AGPL-3.0
├── COMMERCIAL-LICENSE.md        # Termes commerciaux
├── CONTRIBUTING.md              # Guide de contribution
├── CODE_OF_CONDUCT.md           # Règles de la communauté
├── CLA.md                       # Contributor License Agreement
├── SECURITY.md                  # Politique de sécurité
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── question.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── FUNDING.yml              # GitHub Sponsors config
│   └── workflows/
│       ├── ci.yml               # Tests automatiques
│       └── release.yml          # Build & release
│
├── apps/
├── packages/
└── docs/
```

### 4.2 README.md optimisé

```markdown
<div align="center">

# Boardkit

**The offline-first modular whiteboard toolkit**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/kevinbarfleur/boardkit)](https://github.com/kevinbarfleur/boardkit/stargazers)
[![Discord](https://img.shields.io/discord/XXXXX?label=Discord)](https://discord.gg/boardkit)

[Website](https://boardkit.sh) · [Documentation](https://boardkit.sh/docs) · [Download](https://boardkit.sh/download)

<img src="docs/assets/hero-screenshot.png" alt="Boardkit Screenshot" width="800"/>

</div>

---

## ✨ Features

- 🎨 **Infinite Canvas** — Pan, zoom, draw freely
- 📦 **11 Productivity Modules** — Todo, Timer, Kanban, Habits, Stats...
- 🔒 **100% Offline** — Your data stays on your device
- 🔗 **Cross-Module Data Sharing** — Widgets talk to each other
- 📄 **Portable Format** — `.boardkit` files you own forever
- 🖥️ **Desktop App** — Native macOS via Tauri
- 🌐 **Web App** — Works in any browser, no install

## 🚀 Quick Start

### Web (try instantly)
→ [boardkit.sh/app](https://boardkit.sh/app)

### Desktop (macOS)
→ [Download latest release](https://github.com/kevinbarfleur/boardkit/releases)

### From source
\`\`\`bash
git clone https://github.com/kevinbarfleur/boardkit.git
cd boardkit
pnpm install
pnpm dev
\`\`\`

## 💰 Pricing

| Personal | Commercial |
|----------|------------|
| **Free** | **50€/user/year** |
| All features | All features |
| Non-commercial use | Business use |
| Community support | Priority support |

→ [Buy a license](https://boardkit.sh/pricing)

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

Note: By contributing, you agree to our [CLA](CLA.md).

## 📄 License

Boardkit is dual-licensed:
- **AGPL-3.0** for personal/open-source use
- **Commercial License** for business use

See [LICENSE](LICENSE) and [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).

---

<div align="center">
Made with ❤️ by <a href="https://twitter.com/kevinbarfleur">Kevin Barfleur</a>
</div>
```

### 4.3 Gestion des Pull Requests

**Politique :**
- Accepter les PRs qui respectent l'architecture
- Toujours demander la signature du CLA
- Review dans les 7 jours max
- Être bienveillant mais exigeant

**Template PR (.github/PULL_REQUEST_TEMPLATE.md) :**
```markdown
## Description

Décris ta modification en quelques phrases.

## Type de changement

- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 📝 Documentation
- [ ] ♻️ Refactoring
- [ ] 🎨 UI/Design

## Checklist

- [ ] J'ai lu [CONTRIBUTING.md](CONTRIBUTING.md)
- [ ] J'accepte le [CLA](CLA.md)
- [ ] Mon code respecte le design system (@boardkit/ui)
- [ ] J'ai testé mes changements
- [ ] J'ai mis à jour la documentation si nécessaire

## Screenshots (si applicable)

## Notes pour le reviewer
```

### 4.4 GitHub Sponsors

**Fichier .github/FUNDING.yml :**
```yaml
github: kevinbarfleur
open_collective: boardkit
custom: ["https://boardkit.sh/sponsor"]
```

**Tiers suggérés :**
| Tier | Prix | Avantages |
|------|------|-----------|
| ☕ Supporter | 5€/mois | Nom dans les remerciements |
| 🚀 Backer | 15€/mois | + Badge Discord + accès betas |
| 💎 Sponsor | 50€/mois | + Logo sur le README + appel mensuel |
| 🏢 Corporate | 200€/mois | + Logo sur le site + support prioritaire |

---

## 5. Roadmap de Lancement

### Phase 1 : Préparation (Semaines 1-2)

| Tâche | Priorité | Durée |
|-------|----------|-------|
| Changer licence → AGPL + Commercial | 🔴 Critique | 2h |
| Créer CLA + setup CLA Assistant | 🔴 Critique | 1h |
| Écrire README optimisé | 🔴 Critique | 2h |
| Créer templates issues/PR | 🟡 Important | 1h |
| Setup GitHub Sponsors | 🟡 Important | 30min |
| Créer compte Twitter @boardkit | 🔴 Critique | 15min |
| Premier tweet "build in public" | 🔴 Critique | 30min |
| Acheter domaine boardkit.sh | 🔴 Critique | 15min |

### Phase 2 : Landing Page (Semaines 2-3)

| Tâche | Priorité | Durée |
|-------|----------|-------|
| Design landing page (Figma/Framer) | 🔴 Critique | 4-8h |
| Développer landing page | 🔴 Critique | 8-16h |
| Setup Lemon Squeezy (paiements) | 🔴 Critique | 2h |
| Créer page pricing | 🔴 Critique | 2h |
| Enregistrer vidéo démo (2-3min) | 🟡 Important | 2h |
| Écrire documentation de base | 🟢 Nice-to-have | 4h |

### Phase 3 : Soft Launch (Semaines 3-4)

| Tâche | Priorité | Durée |
|-------|----------|-------|
| Tester avec 5-10 beta users | 🔴 Critique | 1 semaine |
| Fix bugs critiques | 🔴 Critique | Variable |
| Collecter témoignages | 🟡 Important | Continu |
| Post Indie Hackers "intro" | 🟡 Important | 1h |
| 3-5 tweets/semaine minimum | 🔴 Critique | 2h/semaine |

### Phase 4 : Lancement Public (Semaines 5-6)

| Tâche | Priorité | Durée |
|-------|----------|-------|
| Thread Twitter de lancement | 🔴 Critique | 2h |
| Post Indie Hackers détaillé | 🔴 Critique | 2h |
| Post Reddit (r/selfhosted, r/productivity) | 🟡 Important | 1h |
| Show HN | 🔴 Critique | 1h |
| BetaList submission | 🟡 Important | 30min |

### Phase 5 : Post-Lancement (Mois 2+)

| Tâche | Priorité | Durée |
|-------|----------|-------|
| Product Hunt (si prêt) | 🟡 Important | 1 journée |
| Continuer build in public | 🔴 Critique | Continu |
| Itérer sur feedback | 🔴 Critique | Continu |
| Développer Boardkit Sync | 🟢 Moyen terme | 2-3 mois |

---

## 6. Stratégie Marketing & Build in Public

### 6.1 Présence Twitter/X

**Profil :**
```
Nom : Boardkit
Handle : @boardkit (ou @getboardkit si pris)
Bio : The offline-first modular whiteboard toolkit 🎨
      Open source · Your data, your device
      Built by @kevinbarfleur
      #buildinpublic
Lien : boardkit.sh
Pinned : GIF/vidéo de l'app en action
Banner : Screenshot épuré du canvas
```

**Cadence de publication :**
| Fréquence | Type de contenu |
|-----------|-----------------|
| 3-5x/semaine | Progress updates, features, behind-the-scenes |
| 1x/semaine | Thread éducatif ou insight |
| 1x/mois | Milestone (stars, users, revenue) |

**Templates de tweets :**

**Progress update :**
```
🚀 Just shipped [FEATURE] in Boardkit

[1 ligne description]

→ [Bénéfice 1]
→ [Bénéfice 2]

[GIF ou screenshot]

Try it: boardkit.sh

#buildinpublic #opensource
```

**Behind the scenes :**
```
Debugging at 2am because [problème drôle] 😅

[Screenshot du code ou du bug]

The joys of #indiehacking

Building: @boardkit
```

**Milestone :**
```
🎉 Boardkit just hit [X] GitHub stars!

Started this project [X] months ago.

Thank you to everyone who believed in
offline-first, user-owned data.

This is just the beginning.

→ boardkit.sh

#buildinpublic #opensource
```

### 6.2 Communautés à investir

| Plateforme | Action | Fréquence |
|------------|--------|-----------|
| **Twitter/X** | Build in public, engagement | Quotidien |
| **Indie Hackers** | Posts journey, commentaires | Hebdomadaire |
| **Reddit** | r/selfhosted, r/productivity, r/vuejs | 2x/mois |
| **Hacker News** | Show HN, commentaires pertinents | Mensuel |
| **Discord** (le tien) | Support, feedback, communauté | Quotidien |
| **Obsidian Discord** | Écoute, pas spam | Passif |

### 6.3 Content marketing (moyen terme)

| Contenu | Objectif | Plateforme |
|---------|----------|------------|
| "Why I chose offline-first" | Thought leadership | Blog + Twitter thread |
| "Building a modular whiteboard" | Technical credibility | Dev.to + HN |
| "From 0 to 100 users" | Story + growth | Indie Hackers |
| Vidéos tutoriels | SEO + activation | YouTube |

---

## 7. Lancement V1

### 7.1 Checklist pré-lancement

```
INFRASTRUCTURE
[ ] Domaine boardkit.sh configuré
[ ] Landing page live
[ ] App web accessible (boardkit.sh/app)
[ ] Downloads macOS disponibles
[ ] Lemon Squeezy configuré (paiements)
[ ] Email de contact fonctionnel

CONTENU
[ ] README GitHub complet
[ ] Vidéo démo (2-3 min)
[ ] Screenshots haute qualité (5-10)
[ ] GIF animé pour Twitter
[ ] Description 1 ligne, 1 paragraphe, 1 page

COMMUNAUTÉ
[ ] Compte Twitter actif
[ ] 10+ tweets "build in public" postés
[ ] 5-10 beta testers ont validé
[ ] Au moins 1 témoignage

LÉGAL
[ ] Licence AGPL + Commercial en place
[ ] CLA configuré
[ ] Mentions légales sur le site
[ ] CGV pour les licences
```

### 7.2 Jour J — Ordre des actions

| Heure | Action | Notes |
|-------|--------|-------|
| 7h | Vérifier que tout fonctionne | Site, app, paiements |
| 8h | **Thread Twitter** (5-7 tweets) | Le plus important |
| 9h | Post Indie Hackers | Avec histoire personnelle |
| 10h | Posts Reddit | r/selfhosted, r/productivity |
| 11h | **Show HN** | Titre accrocheur |
| 12h-18h | Répondre à TOUS les commentaires | Engagement maximal |
| 18h | Tweet récap de la journée | Avec metrics si possible |

### 7.3 Template Show HN

```
Show HN: Boardkit – Offline-first modular whiteboard toolkit

Hey HN,

I've been building Boardkit for the past few months. It's an infinite
canvas with productivity widgets (Todo, Timer, Kanban, Habits...) that
works 100% offline.

Why I built this:
- I was tired of tools that require internet and own my data
- Existing whiteboards are just drawing tools, I wanted productivity built-in
- I believe in portable, user-owned file formats

Key differences from Miro/Excalidraw:
→ 100% offline – your data never leaves your device
→ 11 productivity modules – not just shapes and arrows
→ Cross-module data sharing – widgets can talk to each other
→ Portable .boardkit format – your files, forever
→ Open source (AGPL) with commercial license for businesses

Stack: Vue 3, TypeScript, Tauri (macOS), IndexedDB

Try it: https://boardkit.sh
Code: https://github.com/kevinbarfleur/boardkit

I'd love feedback on [question spécifique].
```

---

## 8. Monétisation & Paiements

### 8.1 Plateforme recommandée : Lemon Squeezy

**Pourquoi Lemon Squeezy :**
- Gère la TVA automatiquement (obligation EU)
- Dashboard simple
- Moins de paperasse que Stripe
- Parfait pour indie devs
- 5% + 0.50€ par transaction

**Alternatives :**
- Stripe (plus complexe, plus flexible)
- Paddle (similaire à Lemon Squeezy)
- Gumroad (plus pour créateurs, moins pour SaaS)

### 8.2 Produits à créer

| Produit | Type | Prix | ID suggéré |
|---------|------|------|------------|
| Supporter | One-time | 25€ | `supporter` |
| Commercial License | Récurrent annuel | 50€/an | `commercial-yearly` |
| Boardkit Sync | Récurrent mensuel | 4€/mois | `sync-monthly` |
| Boardkit Sync | Récurrent annuel | 40€/an | `sync-yearly` |

### 8.3 Flow d'achat

```
┌─────────────────────────────────────────────────────────────────┐
│                     boardkit.sh/pricing                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐     ┌─────────────────┐                  │
│   │   PERSONNEL     │     │   COMMERCIAL    │                  │
│   │   ──────────    │     │   ──────────    │                  │
│   │                 │     │                 │                  │
│   │   GRATUIT       │     │   50€/user/an   │                  │
│   │                 │     │                 │                  │
│   │   [Télécharger] │     │   [Acheter]     │───────┐          │
│   │                 │     │                 │       │          │
│   └─────────────────┘     └─────────────────┘       │          │
│                                                      │          │
│   ┌─────────────────┐                               │          │
│   │   SUPPORTER     │                               │          │
│   │   ──────────    │                               │          │
│   │   25€+ one-time │                               │          │
│   │   [Soutenir]    │───────────────────────────────┼──────┐   │
│   └─────────────────┘                               │      │   │
│                                                      │      │   │
└──────────────────────────────────────────────────────┼──────┼───┘
                                                       │      │
                                                       ▼      ▼
                                              ┌─────────────────────┐
                                              │   LEMON SQUEEZY     │
                                              │   Checkout          │
                                              │                     │
                                              │   • Carte bancaire  │
                                              │   • PayPal          │
                                              │   • TVA auto        │
                                              │   • Facture PDF     │
                                              └─────────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────────┐
                                              │   EMAIL             │
                                              │                     │
                                              │   • Confirmation    │
                                              │   • Clé de licence  │
                                              │   • Facture         │
                                              │   • Lien download   │
                                              └─────────────────────┘
```

### 8.4 Validation de licence (simple)

Pour la V1, pas besoin de DRM complexe :
- L'utilisateur reçoit un email avec sa licence
- Système basé sur l'honneur (comme Obsidian)
- Vérification optionnelle (clé dans l'app)

---

## 9. Croissance Post-Lancement

### 9.1 Les 100 premiers utilisateurs

| Canal | Effort | Potentiel | Timeline |
|-------|--------|-----------|----------|
| Twitter build in public | Continu | 20-50 users | Mois 1 |
| Hacker News Show HN | 1 post | 50-200 users | Jour 1 |
| Reddit | 3-5 posts | 20-50 users | Mois 1 |
| Indie Hackers | Hebdo | 10-30 users | Mois 1-2 |
| Bouche à oreille | Continu | 20-50 users | Mois 2+ |
| **Total estimé** | | **120-380 users** | |

### 9.2 Product Hunt (optionnel, mois 2-3)

**Prérequis :**
- 50+ users actifs
- 3+ témoignages
- Produit stable
- Hunter avec karma (optionnel mais aide)

**Timing :**
- Mardi/Mercredi pour max visibilité
- OU weekend pour moins de compétition
- 00:01 PST obligatoire

### 9.3 Roadmap produit post-V1

| Priorité | Feature | Revenu potentiel |
|----------|---------|------------------|
| 1 | **Boardkit Sync** | 24,000€+/an |
| 2 | Module AI (résumé, génération) | 6,000€+/an |
| 3 | SDK embeddable (B2B) | 50,000€+/an |
| 4 | App iOS/Android | Expansion audience |
| 5 | Templates marketplace | Communauté + revenus |

---

## 10. Métriques & KPIs

### 10.1 Métriques à suivre

| Métrique | Outil | Objectif Mois 1 | Objectif Mois 6 |
|----------|-------|-----------------|-----------------|
| GitHub stars | GitHub | 100 | 500 |
| Visiteurs site | Plausible/Fathom | 1,000 | 5,000/mois |
| Downloads app | GitHub Releases | 50 | 500 |
| Users web app | Analytics | 100 | 1,000 |
| Licences vendues | Lemon Squeezy | 5 | 50 |
| MRR | Lemon Squeezy | 50€ | 500€ |
| Twitter followers | Twitter | 200 | 1,000 |
| NPS (feedback) | Formulaire | >30 | >50 |

### 10.2 Outils recommandés

| Besoin | Outil | Prix |
|--------|-------|------|
| Analytics web | Plausible | 9€/mois |
| Métriques repo | GitHub Insights | Gratuit |
| Paiements | Lemon Squeezy | 5% + 0.50€ |
| Email | Resend | Gratuit (<3k/mois) |
| Feedback | Canny / Notion form | Gratuit |
| Uptime | BetterStack | Gratuit |

---

## 11. Budget & Ressources

### 11.1 Coûts fixes mensuels

| Poste | Coût | Notes |
|-------|------|-------|
| Domaine boardkit.sh | ~4€/mois | ~50€/an |
| Hébergement (Vercel/Netlify) | 0€ | Tier gratuit suffisant |
| Analytics (Plausible) | 9€/mois | Optionnel, peut utiliser gratuit |
| Email (Resend) | 0€ | <3k emails/mois gratuit |
| **Total** | **~15€/mois** | |

### 11.2 Coûts ponctuels

| Poste | Coût | Notes |
|-------|------|-------|
| Domaine (1ère année) | ~50€ | .sh |
| Apple Developer (macOS) | 99$/an | Pour notarization |
| Design (si externe) | 0-500€ | Optionnel |
| **Total** | **~150-650€** | |

### 11.3 Temps estimé

| Phase | Durée | Heures/semaine |
|-------|-------|----------------|
| Préparation | 2 semaines | 10-15h |
| Landing page | 1-2 semaines | 15-20h |
| Lancement | 1 semaine | 20h+ |
| Post-lancement | Continu | 10h/semaine |

---

## 12. Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Personne n'achète de licence | Moyenne | Élevé | Focus sur les sponsors d'abord |
| Fork hostile du code | Faible | Moyen | AGPL protège, CLA en place |
| Pas de traction Twitter | Moyenne | Moyen | Diversifier (HN, Reddit, IH) |
| Bug critique au lancement | Moyenne | Élevé | Beta testers avant |
| Burnout | Moyenne | Élevé | Limiter à 15h/semaine max |
| Concurrence (Excalidraw+ améliore) | Moyenne | Moyen | Différenciation par les modules |

---

## Checklist finale avant lancement

```
SEMAINE -2
[ ] Licence AGPL + Commercial en place
[ ] CLA configuré
[ ] GitHub Sponsors activé
[ ] Compte Twitter créé et actif
[ ] Domaine boardkit.sh acheté

SEMAINE -1
[ ] Landing page live
[ ] Paiements Lemon Squeezy testés
[ ] 5+ beta testers ont validé
[ ] Vidéo démo enregistrée
[ ] Screenshots prêts
[ ] Thread de lancement rédigé

JOUR J
[ ] Tout fonctionne (site, app, paiements)
[ ] Thread Twitter posté à 8h
[ ] Show HN posté à 11h
[ ] Réponses aux commentaires toute la journée
[ ] Récap du soir

POST-LANCEMENT
[ ] Remercier les premiers supporters
[ ] Collecter feedback
[ ] Planifier les prochaines features
[ ] Maintenir le rythme Twitter
```

---

## Ressources

### Lectures recommandées
- [How Obsidian built a $X million business](https://www.google.com/search?q=obsidian+business+model)
- [Excalidraw: Building in Public](https://blog.excalidraw.com/)
- [Indie Hackers: Getting to $10k MRR](https://www.indiehackers.com/)

### Outils mentionnés
- [Lemon Squeezy](https://www.lemonsqueezy.com/) — Paiements
- [Plausible](https://plausible.io/) — Analytics
- [CLA Assistant](https://cla-assistant.io/) — Gestion CLA
- [Framer](https://www.framer.com/) — Landing page
- [BetterStack](https://betterstack.com/) — Monitoring

### Communautés
- [Indie Hackers](https://www.indiehackers.com/)
- [r/SideProject](https://www.reddit.com/r/SideProject/)
- [r/selfhosted](https://www.reddit.com/r/selfhosted/)

---

*Document créé le 2026-01-01*
*Dernière mise à jour : 2026-01-01*
