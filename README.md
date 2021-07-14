# MMM-FreeboxTV

MMM-Freebox est un module pour le projet [MagicMirror](https://github.com/MichMich/MagicMirror) par [Michael Teeuw](https://github.com/MichMich).

Il permet d'afficher, sur votre Mirroir, les chaines de TV de la [Freebox](https://www.free.fr/freebox/).

Voici les chaines actuellement disponibles:

| Numéro  | Chaine |
| ------- | ------ |
| 2 | France 2 |
| 3 | France 3 |
| 14 | France 4 |
| 5 | France 5 |
| 7 | ARTE |
| 8 | C8 |
| 12 | NRJ12 |
| 13 | LCP |
| 15 | BFM TV |
| 16 | C NEWS |
| 17 | C Star |
| 18 | Gulli (uniquement en plein écran) |
| 19 | Culture Box |
| 21 | L'équipe |
| 23 | RMC Story |
| 24 | RMC Découverte |
| 25 | Chérie 25 |
| 27 | France Info |
| 28 | Paris Première |
| 29 | RTL9 |
| 50 | Game One |
| 51 | AB1 |
| 53 | Téva |
| 64 | M6 Music |
| 87 | MCM |
| 90 | Mangas |
| 176 | Equidia |
| 180 | Automoto |
| 261 | RFM TV |
| 271 | MCM Top |
| 347 | BFM Business |

## Screenshoot
![](https://raw.githubusercontent.com/bugsounet/MMM-FreeboxTV/dev/screenshoot.jpg)


## Wiki, installation & guides
  [FR]: http://wiki.bugsounet.fr/fr/MMM-FreeboxTV
  [EN]: http://wiki.bugsounet.fr/en/MMM-FreeboxTV

## Mise à jour
 * V1.3.0 (28-03-2021)
   * Recode avec @bugsounet/cvlc lib.
   * Mise a jour du streamsConfig et du recipe
   * Ajout de npmCheck
   * Ajout de `npm run update`
   * Ajout de `/TVol` , `/TVFull`, `/TVWin` sur telegramBot (controle du volume et de l'affichage)
   * Ajout du control du volume via notification
   * Ajout traduction EN
 * v1.2.0 (29-07-2020)
   * Ajout onStart pour demarrer une chaine au démarrage de MagicMirror
   * Ajout TelegramBot commande (TV)
   * La configuration des streams est maintenant dans un fichier (streamsConfig.json)
 * v1.1.0 (27-07-2020)
   * Mise a jour vers GoogleAssistant et simplifications de code
 * v1.0.2 (14-05-2020)
   * Arrête le `timer screen` de A2D si une chaine est affichée.
 * v1.0.1 (13-05-2020)
   * Affiche directement le module au démarrage

## Exigence
 * Ce module necessite MMM-GoogleAssistant afin de transmettre l'ordre de changement de chaine
 * Nouveau: Utilisation de MMM-TelegramBot pour commander le changement ou l'arrêt

## Le Support est maintenant disponible sur [ce forum](http://forum.bugsounet.fr)
 
## Donation
 [Donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TTHRH94Y4KL36&source=url), si vous aimez ce module !
