# /project:enhance — Amélioration feature existante

Tu améliores une **FEATURE EXISTANTE**.

## Contexte requis (MOYEN)
- Lis d'abord les fichiers de la feature concernée
- Comprends les patterns déjà en place
- Pas besoin de relire toute l'architecture

## Workflow

1. **Lis** les fichiers concernés par la feature
2. **Identifie** les patterns existants
3. **Implémente** en cohérence avec l'existant
4. **Tests** pour les nouveaux comportements
5. **Land**: `/project:land`

## Règles

### FAIRE
- Respecter les patterns existants de cette feature
- Ajouter des tests pour les nouveaux comportements
- Garder la cohérence du code

### NE PAS FAIRE
- Refactorer ce qui n'est pas demandé
- Changer l'architecture de la feature
- Introduire de nouveaux patterns sans raison

## Argument
$ARGUMENTS = Description de l'amélioration à apporter
