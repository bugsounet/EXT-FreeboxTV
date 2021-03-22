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

## Mise à jour
 * V1.3.0 (21-03-2021)
   * Recode avec @bugsounet/cvlc lib.
   * Mise a jour du streamsConfig et du recipe
   * Ajout de npmCheck
   * Ajout de `npm run update`
   * Ajout de `/TVol` sur telegramBot (controle du volume)
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

## Installation
 * Clonez le module dans votre dossier de module de MagicMirror et exécutez `npm install` dans le répertoire du module.
```sh
git clone https://github.com/bugsounet/MMM-FreeboxTV.git
cd MMM-FreeboxTV
npm install
```

 * Ajouter le recipe `with-FreeboxTV.js` dans la configuration du module de MMM-GoogleAssistant
 
```js
{
  module: "MMM-GoogleAssistant",
  position: "fullscreen_above",
  config: {
  ...
    recipes: [ "with-FreeboxTV.js" ],
  ...
  }
},
```
naturellement, si vous avez d'autres recipes, il suffit de le mettre à la suite
```js
recipes: [ "with-MMM-TelegramBot.js", "with-FreeboxTV.js" ],
```

## Configuration
Pour afficher le module, inserez ceci dans votre ficher `config.js`

### Configuration Personalisée
Ceci est la configuration par defaut si vous definissez aucune valeurs

```js
{
  module: 'MMM-FreeboxTV',
  position: 'top_left',
  configDeepMerge: true,
  config: {
    debug: false,
    autoReplay: true,
    fullscreen: false,
    width: 384,
    height: 216,
    onStart: null,
    onStartDelay: 10000,
    streams: "streamsConfig.json",
    volume : {
      start: 100,
      min: 30,
      useLast: true
    }
  }
},
```

| Option  | Description | Type | Defaut |
| ------- | --- | --- | --- |
| debug | Active le mode de debuguage | Booléen | false |
| autoReplay | Reprise de la lecture si le module et caché puis affiché | Booléen | true |
| fullscreen | Affiche la chaine de TV en plein ecran | Booléen | false |
| width | Largeur de la fenetre d'affichage en px | Nombre | 384 |
| height | Hauteur de la fentre d'affichage en px | Nombre | 216 |
| onStart | Numéro de chaine a lancer au démarrage ou null pour desactiver | Nombre | null |
| onStartDelay | Delai du démarrage automatique en ms (utile: permet le chargement de tous les modules) | Nombre | 10000 |
| streams | Nom du fichier contenant les streams des chaines (format JSON) | STRING | streamsConfig.json |

### Champ `volume: {}`
| Option  | Description | Type | Defaut |
| ------- | --- | --- | --- |
|-start| volume au démarrage TV (entre 0 et 100) | Nombre | 100|
|-min| volume en cas d'utilisation de l'assistant | Nombre | 30|
|-useLast| Utilise le dernier volume utilisé | Booléen | true |

UseLast va permettre memoriser le dernier volume utilisé (avec la commande vocale ou avec `/TVol` de telegramBot), si vous activez la fonction.

## Demander un changement de chaine
Activer votre assistant avec votre mot clé préféré et dites `TV <nom de la chaine>`<br>
exemple: `Jarvis ... TV France 2`

## Demander le controle du volume
Activer votre assistant et dites `TV Volume <volume> %`<br>
exemple: `jarvis ... TV Volume 50 %`

## Demander l'arrêt
Activer votre assistant avec votre mot clé préféré et dites `TV stop`<br>

## TelegramBot
une commande `/TV` a été créé:
 * `/TV <numéro de chaine` : zappe sur le numéro de la chaine demandé
 * `/TV`: stop le stream TV
 * `/TVol`: contrôle du volume de la TV (entre 0 et 100)

## Update:
utilisez la commande `npm run update` dans le repertoire du module

## Notes:
 * Si vous avez demandé l'affichage plein écran, le module TV ne s'affichera pas car il n'est pas utile ;)
 * les valeurs `width` et `height` ne sont pas utile en mode plein ecran
 * Vous pouvez ajouter vos propres streams dans `streamsConfig.json`
 * En cas d'activation d'un assistant (MMM-GoogleAssistant ou MMM-Alexa), le son de la TV va se baisser

## Bugs connus
 * petit "bug" lors du démarrage de la video... elle est pas dans le cadre (**en cours de résolution**)

## Options developpeur:
Notification entrante:

 * `TV-PLAY` payload: <numero de la chaine> -> permet de visualiser la chaine
 * `TV-STOP` -> permet l'arrêt
 * `FBTV_VOLUME` payload: <nombre entre 0 et 100> -> permet le changement du volume

## [Le Support est maintenant disponible sur le forum @bugsounet](http://forum.bugsounet.fr)

## English users: translation will be available in wiki !
