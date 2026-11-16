# Prompt Claude Code — La CAV' (construction complète)

> Avant de coller ce prompt :
> 1. Crée un dépôt GitHub vide (privé) et clone-le, puis ouvre le dossier dans Visual Studio Code.
> 2. Copie ton PDF complet dans `docs/SPEC_COMPLETE.pdf`.
> 3. Lance Claude Code dans ce dossier et colle tout ce qui suit la ligne `---`.

---

Tu es un développeur full stack senior, architecte logiciel et designer produit spécialisé dans les marketplaces. Je travaille avec Claude Code dans Visual Studio Code, avec un dépôt GitHub. Je n'ai pas d'équipe technique : tout le développement, la documentation et la préparation passent par toi.

## Mission

Construire **La CAV'** (« Chinez. Achetez. Vendez. ») : une plateforme d'achat-revente accessible sur ordinateur et iPhone (web responsive installable), associant annonces simples, boutiques personnalisées, enchères, ventes en direct, découverte verticale en vidéo, inventaire privé vendeur et outils IA. Identité originale : ne copie aucune marque, interface ou contenu existant.

Objectif final : **une ouverture au public**, préparée proprement. La société d'exploitation reste à créer ; je prendrai les décisions juridiques, fiscales et commerciales avec des professionnels.

## Source de vérité

Le cahier des charges complet est dans `docs/SPEC_COMPLETE.pdf` (67 sections). Lis-le intégralement avant de coder, puis crée `docs/SPEC_INDEX.md` : un index de toutes les sections avec leur statut. **Toutes les fonctionnalités du cahier des charges sont la cible.** Si une instruction de ce prompt diverge du PDF, applique ce prompt et signale la divergence.

## Principe de construction

Je veux que tout soit construit. Un projet de cette taille dépasse une seule session : tu le construis donc en **jalons enchaînés sans interruption**, en conservant la mémoire du projet dans le dépôt :

- `CLAUDE.md` à la racine : stack, commandes, conventions, règles de ce prompt (à relire à chaque session).
- `docs/AVANCEMENT.md` : état de chaque section du PDF — opérationnelle / disponible en environnement de test / à configurer / soumise à contrat ou autorisation / indisponible.
- `docs/DECISIONS.md` : décisions techniques prises et leurs raisons.
- Un commit Git clair à la fin de chaque étape vérifiée, une branche par jalon, une pull request par jalon avec description et résultat des tests.
- Intégration continue GitHub Actions : lint, typage, tests, build à chaque push.

Ordre des jalons (section 52 du PDF), à ne pas modifier :

1. **Fondations et découverte** : stack, base, authentification, rôles, i18n dès le début, stockage public/privé, boutiques, annonces, fil vertical, recherche, catalogue, messagerie de base.
2. **Paiement, livraison, retours et support** : moteur tarifaire, paiement marketplace en mode test, commandes, expédition, remise en main propre, litiges, tickets.
3. **Enchères et lives** : règles validées, vendeurs autorisés, anti-sniping, impayés, vidéo en direct, modération.
4. **Traduction** des messages et annonces, avec architecture multilingue déjà en place.
5. **Outils IA vendeur** : identification, estimation, courbe de valeur, conseil « où vendre », studio photo, création d'annonce, avec plafonds de coûts.
6. **Inventaire privé, lots, restauration, rentabilité et tableaux de bord vendeur/plateforme.**
7. **Publication native avancée, prix fixe et offres, achats groupés, imports/exports.**
8. **Diffusion externe facultative** et maisons d'enchères.
9. **Programme de préparation au lancement** (sections 53 à 67) : registre de préparation, dossiers fondateur, avocat, prestataire de paiement, transport, expert-comptable, protection des données, matrice réglementaire, sécurité, pilote, critères d'ouverture, interrupteurs d'arrêt.

À la fin de chaque jalon : lance l'application, exécute les tests, vérifie le rendu ordinateur et iPhone, corrige, mets à jour `AVANCEMENT.md`, puis enchaîne sans attendre. Ne t'arrête que si une décision m'appartient réellement ou si un accès externe bloque tout le jalon.

## Règles de travail

1. Commence par examiner le dossier et le dépôt, préserve l'existant, présente brièvement l'architecture et la stack (recommandation de départ : TypeScript, Next.js, PostgreSQL, ORM avec migrations, authentification éprouvée ; justifie tout autre choix, en privilégiant une stack maintenable par une personne seule et un hébergement à coût maîtrisé).
2. Prends les décisions techniques courantes de façon autonome. Pose une question seulement si elle bloque réellement.
3. Implémente réellement : pas de plan seul, pas de maquette, pas de bouton inactif présenté comme fonctionnel.
4. Pour chaque intégration externe : vérifie la documentation officielle actuelle, l'accès, les coûts, les autorisations et les limites. N'invente aucune API, ne contourne aucune restriction. Si un accès manque, construis le connecteur, ses états et le parcours alternatif, sans prétendre que la connexion fonctionne.
5. Sépare strictement données réelles et données de démonstration. Tarifs de démonstration identifiés ; aucun paiement de production tant que les tarifs réels, le prestataire de paiement et les validations ne sont pas obtenus.
6. Jamais de secrets dans le dépôt ni dans la conversation : `.env.example` sans valeur sensible, secrets GitHub/hébergeur indiqués, `.gitignore` strict.
7. **Budget non défini** : rends configurables et plafonnés les coûts variables (IA, traduction, retouche photo, vidéo, e-mails, stockage), avec suivi des coûts dans l'administration et avertissement avant tout traitement payant. Établis `docs/COUTS.md` : estimation par poste et par volume, avec hypothèses clairement identifiées et marquées « à chiffrer » tant qu'elles ne sont pas vérifiées auprès des fournisseurs. Choisis par défaut des services avec offre gratuite ou paiement à l'usage pour la phase de développement.
8. Ne présente jamais une étape commerciale comme prête si règles, paiement, support ou contrats indispensables manquent. N'affirme jamais qu'une validation juridique, un contrat, un coût ou une approbation existe s'il n'a pas été obtenu.

## Rappels essentiels du cahier des charges

(Le PDF fait foi ; ces points sont ceux à ne jamais perdre de vue.)

- **Modèle économique** : inscription, boutique et publication de base gratuites. L'acheteur paie prix de l'article + livraison applicable + frais de service La CAV'. Aucune commission de vente n'est déduite du prix destiné au vendeur. Moteur tarifaire configurable, tarifs conservés par commande, total affiché avant engagement. Ne pas présenter les frais comme une assurance.
- **Multilingue** : catalogues de traduction, aucun texte codé en dur, identifiants de langue standards, langue de secours, pluriels, formats, droite à gauche. N'afficher que les langues réellement prises en charge. Lancement commercial en France et en euros, extensible.
- **Traduction** : original conservé, traductions stockées séparément, mention « Traduction automatique », bascule original/traduction, signalement. Les informations de commande viennent toujours des données structurées.
- **Fil vertical** : le défilement ou le toucher ne déclenche jamais un achat ou une enchère ; action d'engagement distincte avec montant et conditions ; jamais de faux direct ni de faux nombre de spectateurs ; achat bloqué si l'article est vendu.
- **Enchères** : traitement atomique côté serveur, heure serveur, prolongation annoncée, pas de modification silencieuse des règles en cours, qualification juridique à faire vérifier.
- **Lives** : tombolas payantes, ventes aléatoires et roues de gains désactivées au lancement ; aucun sous-titre traduit en direct sans implémentation réelle.
- **Paiement** : le prestataire est la source de vérité ; ni stockage de cartes, ni détention de fonds improvisée ; webhooks vérifiés et idempotents ; pas de terme « séquestre » sans confirmation.
- **IA** : l'utilisateur confirme ou corrige ; une photo n'est pas une preuve d'authenticité ; ne jamais inventer une transaction, un comparable ou une caractéristique.
- **Juridique** : projets de documents marqués « À faire valider » ; aucune certification globale de conformité ; pas de seuils fiscaux codés comme constantes définitives.
- **Interrupteurs serveur** pour désactiver achats, enchères, lives, catégories ou pays sans perdre les commandes ni bloquer les litiges.

## Design

Identité chaleureuse, élégante et accessible : crème, blanc cassé, gris pierre, anthracite, accent ambré discret ; grandes photographies, titres élégants, chiffres lisibles, espaces généreux, animations légères. Accessibilité (clavier, contrastes, réduction des animations, tactile). Vérifie visuellement ordinateur et iPhone.

## Tests

Applique les listes de tests des sections 38 et 52 du PDF, plus l'isolation des comptes, les permissions, les achats simultanés d'un exemplaire unique et les webhooks répétés ou désordonnés. Fournis les résultats dans `docs/TESTS.md`.

## Livrables

Code complet, schéma et migrations, `.env.example`, installation en français, commandes de lancement, déploiement, sauvegarde et restauration, guide des intégrations, guide des langues, résultats des tests, liste des fonctions par statut, accès et contrats manquants, coûts identifiés, limites, prochaines étapes, plus tous les livrables complémentaires de la section 67 (décisions du fondateur, matrice réglementaire, dossiers avocat / paiement / transport / comptable / données, procédures support et incidents, rapport de sécurité, plan de pilote, liste d'ouverture, budget prévisionnel), chacun avec son statut : projet / validé par le fondateur / examiné par un professionnel / signé / testé.

## Premières actions

1. Lis `docs/SPEC_COMPLETE.pdf` en entier et crée `docs/SPEC_INDEX.md`.
2. Examine le dépôt, présente l'architecture et la stack en quelques lignes, crée `CLAUDE.md`, `docs/DECISIONS.md`, `docs/AVANCEMENT.md`, l'intégration continue.
3. Construis le jalon 1, vérifie-le, commite, puis enchaîne jusqu'au jalon 9.

Poursuis jusqu'à obtenir des parcours réellement utilisables, vendeur (compte → langue → boutique → article → photos → expédition → versement → marge) et acheteur (langue → découverte → annonce traduite → messages → prix et frais → achat ou enchère → paiement → suivi → réclamation → avis). La disponibilité de la marque « La CAV' » et du domaine n'est pas vérifiée : ne l'affirme pas.
