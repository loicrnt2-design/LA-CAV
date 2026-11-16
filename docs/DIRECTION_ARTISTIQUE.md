# Direction artistique — La CAV'

Statut : première application en cours, à valider avec le fondateur.

## Références et interprétation

Les planches communiquées montrent une alternance de clair et de sombre, des titres à forte échelle, de petites étiquettes techniques, des boutons arrondis et des images occupant une grande place. La référence automobile privilégie une typographie sans empattement, des chiffres et des fonds sombres ; la référence architecturale utilise une serif à italiques et des couleurs de pierre.

Pour La CAV', l'interprétation retenue est une identité originale : fond crème et anthracite, touches sable et ambrées, titres éditoriaux en serif, texte courant et prix en sans-serif, indications courtes en monospace. Le fil est sombre, les boutiques et les parcours d'engagement restent clairs et sobres. Les fiches mettent en avant uniquement les informations effectivement disponibles.

Les noms, logos, textes et images des références ne sont pas repris. Aucun défilement n'est imposé et aucune animation ne bloque le contenu. Lorsque la réduction des animations n'est pas demandée, un léger zoom au survol et, dans les navigateurs compatibles, une apparition des images au défilement et un indicateur de progression apportent du mouvement. Aucun suivi d'expédition, compteur ou média n'est inventé.

## Jetons et polices

Les jetons figurent dans `src/app/tokens.css` ; les composants utilisent le thème clair par défaut et le thème sombre local au contexte. Cormorant Garamond (y compris les vraies italiques), Manrope et IBM Plex Mono sont servis localement en WOFF2. Leurs licences SIL Open Font License 1.1 et leurs mentions d'auteur sont fournies dans `public/fonts/`. Les sous-ensembles cyrilliques sont inclus ; l'arabe utilise les polices système en repli.

Les contrastes suivants ont été calculés selon la luminance relative WCAG : anthracite sur crème 15,80:1 ; pierre sur crème 5,78:1 ; texte crème sur anthracite 15,80:1 ; texte secondaire sur anthracite 11,07:1 ; anthracite sur ambre 7,93:1 ; erreur en clair 7,01:1 ; erreur en sombre 8,87:1 ; texte du visuel de substitution sur sa couleur la plus claire 7,17:1. Ces contrôles concernent les couples indiqués et ne remplacent pas un audit complet de tous les états, fonds et contenus futurs.

## Contrôles effectués

- Captures locales : `docs/captures/accueil-ordinateur.png` et `docs/captures/accueil-mobile.png`. La seconde utilise une émulation Chromium de 390 × 844, pas un iPhone physique ni Safari.
- Sur la page d'accueil, les valeurs mesurées à 390 px en arabe et avec des exemples de titres longs allemands, russes et arabes donnent une largeur de document de 390 px. Allemand et russe sont des exemples de contenu, pas des langues d'interface disponibles.
- Environnement local, navigateur Edge, build de production, sans simulation 4G : une navigation a rapporté environ 167 ms, 6 005 octets de HTML encodé et 249 269 octets de ressources encodées selon l'API Performance. Il s'agit d'une mesure ponctuelle, pas d'un résultat iPhone ni d'une garantie de performance réseau ; la mesure 4G réelle reste à faire.
- `/design` est accessible en développement et renvoie 404 en production. Le catalogue ne couvre que les composants déjà disponibles.
- Les photos et la galerie ont été vérifiées dans un navigateur local avec des images synthétiques, ainsi qu'à une largeur émulée de 390 px : la galerie défile horizontalement sans élargir le document. Avec la préférence de réduction des animations, les animations contrôlées étaient désactivées. Ce contrôle ne remplace pas un essai sur appareil physique.

## Écarts et suites

Les annonces peuvent recevoir jusqu'à quatre photos JPEG, PNG ou WebP non animées (4 Mo et 20 mégapixels maximum par photo). La première est utilisée comme couverture, et la fiche affiche une galerie. Les images affichées sont réencodées en WebP sans métadonnées ; les originaux restent privés dans la base SQLite locale et peuvent conserver des métadonnées sensibles. Sans photo, un espace réservé signale « Photo indisponible ». Le stockage de production, la 3D et le studio avant/après restent à réaliser.

Les tableaux de stock, indicateurs financiers et suivi d'expédition réel ne sont pas encore implémentés. Ils ne sont donc pas représentés par de fausses données ou un faux parcours. La personnalisation graphique des boutiques et un catalogue exhaustif de composants sont à compléter. Le parcours de commande actuel reste exclusivement simulé ; aucun prestataire n'est connecté.

Le dossier courant n'est pas un dépôt Git : aucun commit n'a été créé.
