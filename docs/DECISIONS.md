# Décisions techniques

- **Next.js (App Router) + TypeScript** : une seule base de code front/back, maintenable par une personne seule.
- **SQLite (better-sqlite3)** pour démarrer sans serveur. Schéma SQL dans `src/lib/db.ts`. Migration vers PostgreSQL prévue avant la mise en production (concurrence enchères/stock, sauvegardes).
- **Sessions** : jeton aléatoire en cookie httpOnly, seul son hash SHA-256 est stocké ; mots de passe bcrypt.
- **Montants en centimes entiers** (`src/lib/pricing.ts`), arrondi explicite. Taux de frais = DÉMO.
- **i18n maison** (`src/lib/i18n.ts`) : catalogues par langue, repli sur le français, `Intl` pour les montants, `dir` RTL.
- **Aucune fausse intégration** : paiement, livraison, traduction, IA et vidéo ne sont pas implémentés. L'onboarding Stripe Connect est préparé en mode test uniquement, désactivé par défaut et non validé auprès de Stripe. Les valeurs de `.env.example` ne mettent aucun connecteur en marche.
- **Fil** : classement par fraîcheur, sans pondération payante ; ouvrir une annonce est la seule action du fil.
- **Commandes simulées** : tables séparées des futures commandes réelles, réservées aux annonces fictives. Les totaux et la règle de frais sont figés, et une clé de confirmation empêche le double enregistrement. Aucun paiement ou mouvement de stock.
