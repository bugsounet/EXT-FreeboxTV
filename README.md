# MMM-FreeboxTV

MMM-Freebox est un module pour le projet [MagicMirror](https://github.com/MichMich/MagicMirror) par [Michael Teeuw](https://github.com/MichMich).

Il permet d'afficher, sur votre Mirroir, les chaines de TV de la [Freebox](https://www.free.fr/freebox/).

Voici les chaines actuellement disponibles:

 * France 2
 * France 3
 * France 4
 * France 5
 * ARTE
 * C8
 * NRJ12
 * LCP
 * BFM TV
 * C NEWS
 * C Star
 * Gulli (uniquement en plein écran)
 * France ô
 * L'équipe
 * RMC Story
 * RMC Découverte
 * Chérie 25
 * France Info
 * Paris Première
 * RTL9
 * Game One
 * AB1
 * Téva
 * M6 Music
 * MCM
 * Mangas
 * Equidia
 * Automoto
 * RFM TV
 * MCM Top
 * BFM Business

## Screenshoot
![](https://raw.githubusercontent.com/bugsounet/MMM-FreeboxTV/dev/screenshoot.jpg)

## Exigence
 * Ce module necessite MMM-AssistantMk2 afin de transmettre l'ordre de changement de chaine 

## Installation
 * Clonez le module dans votre dossier de module de MagicMirror et exécutez `npm install` dans le répertoire du module.
```sh
git clone https://github.com/bugsounet/MMM-FreeboxTV.git
cd MMM-FreeboxTV
npm install
```

 * Ajouter le recipe `with-FreeboxTV.js` dans la configuration du module de MMM-AssistantMk2
 
```js
{
  module: "MMM-AssistantMk2",
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
  config: {
    debug: false,
    autoReplay: true,
    fullcreen: false,
    width: 384,
    height: 216,
    },
},
```

| Option  | Description | Type | Defaut |
| ------- | --- | --- | --- |
| debug | Active le mode de debuguage | Booléen | false |
| autoReplay | Reprise de la lecture si le module et caché puis affiché | Booléen | true |
| fullscreen | Affiche la chaine de TV en plein ecran | Booléen | false |
| width | Largeur de la fenetre d'affichage en px | Nombre | 384 |
| height | Hauteur de la fentre d'affichage en px | Nombre | 216 |

## Demander un changement de chaine
Activer votre assistant avec votre mot clé préféré et dites `TV <nom de la chaine>`<br>
exemple: `Jarvis ... TV France 2`

## Demander l'arrêt
Activer votre assistant avec votre mot clé préféré et dites `TV stop`<br>

## Notes:
 * Si vous avez demandé l'affichage plein écran, le module TV ne s'affichera pas car il n'est pas utile ;)
 * les valeurs `width` et `height` ne sont pas utile en mode plein ecran
 
## Bugs connus
 * petit "bug" lors du démarrage de la video ... elle est pas dans le cadre (**en cours de résolution**)
