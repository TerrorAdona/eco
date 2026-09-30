# Eco - Application de Gestion Financière Personnelle

## Vue d'ensemble

Eco est une application de gestion financière personnelle permettant de suivre ses budgets, transactions, objectifs d'épargne et transactions récurrentes. L'application est construite avec Next.js (App Router), TypeScript, Clerk pour l'authentification, Prisma pour l'accès aux données et DaisyUI pour le styling.

## Structure du projet

```
app/
├── action.ts                 # Server Actions pour toutes les mutations de données
├── page.tsx                  # Page d'accueil
├── layouts.tsx               # Layout racine
├── budgets/                  # Gestion des budgets
├── transactions/             # Historique des transactions
├── objectifs/                # Objectifs d'épargne
├── recurrents/               # Transactions récurrentes
├── dashboard/                # Tableau de bord analytique
├── manage/[budgetId]/        # Gestion détaillée d'un budget
├── sign-in/                  # Page de connexion
├── sign-up/                  # Page d'inscription
└── [...].tsx                 # Routes d'authentification Clerk

components/
├── Wrapper.tsx               # Composant de mise en page commun
├── Notification.tsx          # Système de notifications
├── BudgetItem.tsx            # Affichage d'un budget
├── TransactionItem.tsx       # Affichage d'une transaction
├── SavingsGoalItem.tsx       # Affichage d'un objectif
├── CategoryIcon.tsx          # Icônes de catégorie
├── auth/                     # Composants d'authentification
│   ├── auth-shell.tsx
│   └── clerk-appearance.ts

lib/
├── validators.ts             # Schémas de validation Zod
├── budget-alerts.ts          # Système d'alertes budgétaires
├── analytics.ts              # Analyse financière (comparaison de période, dépenses inhabituelles)
├── recurrence.ts             # Gestion des transactions récurrentes
├── csv.ts                    # Export CSV des transactions
├── prisma.ts                 # Client Prisma singleton
└── budget-alerts.test.ts     # Tests unitaires

prisma/
├── schema.prisma             # Modèle de base de données
├── seed.ts                   # Données de peuplement
└ migrations/                 # Historique des migrations

type.ts                       # Interfaces TypeScript partagées
```

## Fonctionnalités principales

### 1. Gestion des budgets
- Créer, modifier, supprimer des budgets
- Chaque budget a un nom, un montant, une catégorie et des transactions associées
- Alertes automatiques : 80% (avertissement), 100% (critique), dépassé
- Vérification que le montant du budget ne peut pas être inférieur aux dépenses déjà enregistrées

### 2. Suivi des transactions
- Ajouter, modifier, supprimer des transactions dans un budget
- Chaque transaction a une description, un montant, une catégorie et une date
- Vérification que le montant total des transactions ne dépasse pas le budget

### 3. Objectifs d'épargne
- Définir des objectifs financiers avec montant cible, montant actuel et date cible
- Fonctionnalité de versement pour ajouter de l'épargne à un objectif
- Visualisation de la progression vers l'objectif

### 4. Transactions récurrentes
- Configurer des revenus ou dépenses qui se répètent (hebdomadaire, mensuel, annuel)
- Option d'association à un budget
- Fonction d'activation/désactivation
- Calcul automatique des prochaines occurrences

### 5. Tableau de bord analytique
- Vue d'ensemble : total des budgets, dépenses periodiques, montant restant
- Graphiques : dépenses par catégorie, évolution temporelle
- Analyse : comparaison de période, détection de dépenses inhabituelles
- Alertes budgétaires consolidées
- Progression des objectifs d'épargne
- Détail par budget

### 6. Export des données
- Export CSV des transactions avec filtrage par période, catégorie, budget, montant
- Nom de fichier automatisé basé sur la date/heure

## Règles de développement essentielles

1. Analyser toujours le code existant avant de modifier quoi que ce soit.
2. Conserver l'architecture actuelle du projet.
3. Ne pas réécrire les fichiers qui fonctionnent déjà sans nécessité.
4. Maintenir la façon actuelle de coder :
   - TypeScript
   - Next.js App Router
   - Server Actions existantes
   - composants React réutilisables
   - séparation logique serveur / interface
   - Prisma pour l'accès aux données
   - Clerk pour l'authentification
   - DaisyUI et les classes de style déjà utilisées.
5. Réutiliser les composants existants lorsqu'ils peuvent être adaptés.
6. Ne pas créer plusieurs composants qui font la même chose.
7. Ne pas changer de technologie sans justification et sans me demander confirmation.
8. Ne pas migrer vers PostgreSQL, Supabase, Drizzle ou une autre solution. Conserver la base de données actuelle.
9. Ne pas remplacer Prisma par une autre ORM.
10. Ne pas remplacer Clerk par une autre solution d'authentification.
11. Ne pas transformer les Server Actions existantes en API inutilement.
12. Respecter les conventions de nommage déjà présentes dans le projet.
13. Ne pas modifier inutilement le design existant.
14. Les nouvelles fonctionnalités doivent avoir le même style visuel que les fonctionnalités existantes.
15. Éviter les commentaires inutiles et le code mort.
16. Utiliser des types TypeScript précis et éviter `any`.
17. Toutes les opérations concernant les données d'un utilisateur doivent vérifier que les données appartiennent bien à l'utilisateur authentifié.
18. Avant chaque modification importante, expliquer brièvement :
    - ce qui existe actuellement ;
    - ce qui va être modifié ;
    - pourquoi cette modification est nécessaire.
19. Après chaque fonctionnalité :
    - vérifier les erreurs TypeScript ;
    - vérifier les erreurs ESLint ;
    - vérifier que l'application compile ;
    - vérifier que les fonctionnalités existantes ne sont pas cassées.
20. Ne pas développer plusieurs grosses fonctionnalités simultanément.
21. Travailler étape par étape et conserver le fonctionnement existant à chaque étape.

## Conventions techniques

### Validation des données
- Utilisation de Zod pour tous les schémas de validation dans `lib/validators.ts`
- Fonction utilitaire `parseOrThrow` pour gérer les erreurs de validation
- Validation côté serveur dans toutes les Server Actions

### Gestion des erreurs
- Toutes les Server Actions utilisent try/catch avec logging d'erreur
- Les erreurs sont propagées vers les composants clients pour affichage utilisateur
- Messages d'erreur en français

### Authentification
- Utilisation de Clerk avec vérification d'utilisateur via `checkAndAddUser` dans les Server Actions
- Tous les points d'accès vérifient que l'utilisateur est authentifié
- Les opérations sur les données vérifient toujours la propriété (`userId`)

### Styling
- Utilisation de DaisyUI avec classes utilitaires Tailwind
- Thème personnalisé avec couleurs primaires/accent
- Composants réutilisables pour les éléments courants (badges, boutons, cartes)

### Internationalisation
- Interface entièrement en français
- Formatage monétaire avec `toLocaleString("fr-FR")` et monnaie "Ar" (Ariary)
- Dates formatées avec `toLocaleDateString("fr-FR")`

## Points d'extension recommandés

- Ajout de nouvelles catégories : Mettre à jour `TRANSACTION_CATEGORIES` dans `type.ts`
- Nouveaux types d'analyse : Étendre le fichier `lib/analytics.ts`
- Additional export formats : Étendre `lib/csv.ts` pour PDF, Excel, etc.
- Améliorations du tableau de bord : Ajouter de nouveaux widgets dans `app/dashboard/page.tsx`
- Internationalisation : Bien que l'application soit en français, structurer pour faciliter l'ajout d'autres langues
- Graphiques avancés : Intégrer une bibliothèque de charting pour des visualisations plus riches

## Commandes utiles

```bash
# Installation
npm install

# Développement
npm run dev

# Build de production
npm run build

# Linting
npm run lint

# Tests
npm test
```

## Ligne directrice pour les contributions

Lorsque vous travaillez sur ce projet, suivez toujours les règles essentielles listées ci-dessus. L'objectif est de maintenir et améliorer l'application existante, pas de la réécrire complètement. Toute modification doit préserver l'expérience utilisateur existante tout en apportant des améliorations réfléchies.