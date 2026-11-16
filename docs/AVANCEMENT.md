# Avancement — La CAV'

Légende : ✅ opérationnel · 🧪 environnement de test/démo · ⚙️ à configurer · 📄 contrat/autorisation requis · ⛔ indisponible

## Jalon 1 — Fondations et découverte (en cours)

| Fonction | Statut | Remarque |
|---|---|---|
| Comptes (inscription, connexion, sessions httpOnly) | ✅ | Pas encore : vérification e-mail, récupération de mot de passe, export/suppression |
| Acceptation versionnée des conditions | 🧪 | Version « brouillon-0.1 », texte « À faire valider » |
| Boutiques (création auto, page publique, suivi) | ✅ | Logo/bannière/collections : à faire |
| Annonces (brouillon, publication, archivage, vues, favoris) | ✅ | Jusqu'à 4 photos par annonce, galerie, couverture et gestion par le propriétaire ; stockage local de prototype. |
| Fil vertical Pour toi / Abonnements / En direct | ✅ | Aucun achat par simple tap ; « Pourquoi cet article ? », « Pas intéressé », réinitialisation, alternative en liste. Vidéo : à faire. Onglet Direct : ⛔ |
| Recherche + filtres (texte, catégorie, état, prix max, marque, lieu, remise, pagination) | ✅ | Le filtre d'envoi repère uniquement les frais indiqués sur l'annonce, sans vérifier de transporteur ni de zone desservie. |
| Messagerie interne liée à l'annonce | ✅ | Traduction : ⚙️ non configurée (indiqué à l'écran) |
| Signalement d'annonce et file d'examen | 🧪 | File locale réservée aux administrateurs, avec note et historique récent. Aucun masquage ni notification automatique ; modération opérationnelle, recours et limitation des abus à faire. |
| i18n FR / EN / AR (RTL, fallback FR, sélecteur, cookie + compte) | ✅ | AR partiel (repli sur FR) ; détection Accept-Language |
| Moteur tarifaire (centimes entiers, min/plafond) | 🧪 | **Taux DÉMO** ; frais affichés avant tout engagement |
| PWA (manifeste, icône) | 🧪 | Pas de service worker / hors ligne |
| Données démo | 🧪 | 8 annonces marquées « Démo », compte démo non connectable |
| Direction artistique | 🧪 | Première application : fil sombre, pages claires, polices locales, photos et animations discrètes, `/design` en développement. Composants liés aux fonctions non implémentées à venir. Voir `docs/DIRECTION_ARTISTIQUE.md`. |

## Jalon 2 — Commandes, paiement, livraison et support (en cours)

| Fonction | Statut | Remarque |
|---|---|---|
| Récapitulatif de commande | 🧪 | Simulation uniquement pour une annonce fictive publiée, après connexion. Prix, frais et port fictifs sont conservés dans la simulation. |
| Livraison et remise en main propre | 🧪 | Choix simulé seulement si l'annonce fictive le permet ; pas de devis, de point relais, d'adresse ou d'expédition réelle. |
| Historique, annulation et demande de support ou retour | 🧪 | Données locales réservées au compte. Aucun paiement à rembourser ; les demandes ne sont transmises à aucun service client et ne sont pas des demandes juridiques réelles. |
| Double soumission | 🧪 | Une même confirmation de simulation ne crée pas deux enregistrements ; aucun stock n'est réservé ou modifié. |
| Inscription vendeur Stripe Connect | 🧪 | Code de test désactivé par défaut ; vérifié avec un faux adaptateur uniquement, pas avec Stripe. Aucun paiement activé ; voir `docs/PAIEMENT.md`. |
| Paiement Stripe Connect | ⛔ | Non implémenté, y compris en mode test ; voir `docs/PAIEMENT.md`. |
| Transporteurs et étiquettes | ⛔ | Non implémentés, contrats et tarifs à confirmer. |
| Commandes et retours réels, support opérationnel | ⛔ | À concevoir et valider avant ouverture. |

## Jalons suivants (non commencés)
3 Enchères et lives (📄) · 4 Traduction · 5 Outils IA · 6 Inventaire privé et rentabilité · 7 Publication avancée/offres · 8 Diffusion externe · 9 Préparation au lancement (dossiers, matrice réglementaire, interrupteurs d'arrêt).

## Limites connues
- Achat, offres, enchères, lives, expédition : **désactivés**. L'onboarding Stripe de test est désactivé tant que sa configuration n'est pas renseignée.
- Le parcours de simulation ne fait appel à aucun prestataire et ne teste pas ses API ; il ne constitue ni une transaction, ni une réservation de stock.
- Photos stockées dans SQLite local : pas de stockage adapté à la production, de sauvegarde ou de studio photo. Les originaux privés peuvent conserver des métadonnées sensibles ; les images affichées sont réencodées sans métadonnées.
- File locale d'examen des signalements uniquement : pas de modération opérationnelle complète ni de limitation de débit.
- Aucune validation juridique, aucun contrat, aucun coût vérifié.
