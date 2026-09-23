<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Règles obligatoires pour continuer le projet Eco

Tu travailles sur un projet Next.js existant nommé `eco`.

Ta mission est de continuer et terminer le projet existant, et non de le reconstruire.

### Règles essentielles

1. Analyse toujours le code existant avant de modifier quoi que ce soit.

2. Conserve l'architecture actuelle du projet.

3. Ne réécris pas les fichiers qui fonctionnent déjà sans nécessité.

4. Conserve ma façon actuelle de coder :

   * TypeScript
   * Next.js App Router
   * Server Actions existantes
   * composants React réutilisables
   * séparation logique serveur / interface
   * Prisma pour l'accès aux données
   * Clerk pour l'authentification
   * DaisyUI et les classes de style déjà utilisées.

5. Réutilise les composants existants lorsqu'ils peuvent être adaptés.

6. Ne crée pas plusieurs composants qui font la même chose.

7. Ne change pas de technologie sans justification et sans me demander confirmation.

8. Ne migre pas vers PostgreSQL, Supabase, Drizzle ou une autre solution. Conserve la base de données actuelle.

9. Ne remplace pas Prisma par une autre ORM.

10. Ne remplace pas Clerk par une autre solution d'authentification.

11. Ne transforme pas les Server Actions existantes en API inutilement.

12. Respecte les conventions de nommage déjà présentes dans le projet.

13. Ne modifie pas inutilement le design existant.

14. Les nouvelles fonctionnalités doivent avoir le même style visuel que les fonctionnalités existantes.

15. Évite les commentaires inutiles et le code mort.

16. Utilise des types TypeScript précis et évite `any`.

17. Toutes les opérations concernant les données d'un utilisateur doivent vérifier que les données appartiennent bien à l'utilisateur authentifié.

18. Avant chaque modification importante, explique brièvement :

* ce qui existe actuellement ;
* ce qui va être modifié ;
* pourquoi cette modification est nécessaire.

19. Après chaque fonctionnalité :

* vérifie les erreurs TypeScript ;
* vérifie les erreurs ESLint ;
* vérifie que l'application compile ;
* vérifie que les fonctionnalités existantes ne sont pas cassées.

20. Ne développe pas plusieurs grosses fonctionnalités simultanément.

Travaille étape par étape et conserve le fonctionnement existant à chaque étape.

