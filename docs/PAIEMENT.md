# Paiement marketplace — préparation

Statut : **onboarding vendeur Stripe Connect préparé uniquement pour le mode test**, désactivé par défaut et non vérifié avec un véritable compte Stripe. Il n'existe toujours aucune intégration de paiement, y compris en mode test : le parcours de commande actuel reste une simulation locale indépendante de Stripe.

Stripe Connect est une piste pour les futurs essais. Sa documentation sur les [paiements indirects](https://docs.stripe.com/connect/marketplace/tasks/accept-payment/destination-charges) précise que la plateforme crée le paiement et que son solde supporte notamment les frais, remboursements et contestations. Le choix du montage et des responsabilités doit être validé avec le prestataire et les conseils de la société avant implémentation.

## Onboarding vendeur de test

L'utilisateur connecté peut demander la création d'un compte Express de test et poursuivre l'inscription sur une page hébergée par Stripe. Le retour ne prouve pas que le parcours est achevé : un bouton interroge Stripe et affiche la date du dernier contrôle, les informations soumises et l'état des virements de test. Un lien expiré conduit à la page locale, où l'utilisateur peut demander un nouveau lien.

La création est associée à la plateforme et à une clé d'idempotence enregistrées dans SQLite. Après une erreur de résultat incertain, les tentatives réutilisent cette clé ; après 23 heures, la reprise automatique est bloquée car Stripe peut supprimer ses clés d'idempotence après 24 heures. Il faut alors vérifier manuellement le compte de test et réconcilier la base avant toute nouvelle tentative. Ce mécanisme reste expérimental et ne remplace ni une procédure d'exploitation, ni des migrations et sauvegardes de production.

Pour un essai local, créer et configurer une plateforme Stripe Connect en **mode test** et utiliser uniquement les données fictives recommandées par Stripe. Dans `.env.local`, définir `PAYMENT_PROVIDER=stripe_test`, `STRIPE_TEST_SECRET_KEY` avec une clé secrète de test et `APP_BASE_URL` avec l'origine locale, par exemple `http://localhost:3000`. Ne pas partager les clés dans une conversation ni les committer. Les clés de production sont refusées. L'origine configurée ne doit contenir ni chemin, ni identifiants, ni paramètres ; HTTP est accepté uniquement pour localhost et les adresses de boucle locale. Redémarrer le serveur après modification. Un compte Stripe réel, ses permissions et son éventuelle facturation restent à vérifier auprès de Stripe.

Les tests automatisés utilisent un faux adaptateur et n'appellent pas Stripe. L'intégration réelle, les permissions de la clé, la création du compte et les liens hébergés doivent encore être vérifiés avec un compte de test. Références : [création de compte](https://docs.stripe.com/connect/marketplace/tasks/create), [onboarding](https://docs.stripe.com/connect/marketplace/tasks/onboard), [liens d'inscription](https://docs.stripe.com/api/account_links/create) et [idempotence](https://docs.stripe.com/api/idempotent_requests).

## Prochaines étapes de paiement

Implémenter et vérifier le paiement de test, les règles tarifaires retenues et le traitement des événements. Les [événements et la vérification des signatures](https://docs.stripe.com/webhooks/signature) doivent être gérés côté serveur, avec idempotence, traitement des doublons et de l'ordre des événements. Voir aussi les [remboursements et contestations](https://docs.stripe.com/connect/marketplace/tasks/refunds-disputes).

Avant toute ouverture réelle : contrat et disponibilité du service à confirmer, prix à valider, comptabilité en partie double et rapprochement, gestion des remboursements et contestations, sécurité, transporteurs, support et règles juridiques à réaliser et vérifier. Ne jamais enregistrer de données de carte bancaire dans La CAV'. Les clés restent dans l'environnement serveur ; ne pas les envoyer dans la conversation.
