/** EXT-FreeboxTV **/
/** commande vocale **/
/**  @bugsounet  **/

var recipe = {
  transcriptionHooks: {
    "VOLUMETV": {
      pattern: "TV volume (.*)",
      command: "VOLUMETV"
    },
    "stop": {
      pattern: "TV stop",
      command: "stop"
    },
    "france2": {
      pattern: "TV france 2",
      command: "france2"
    },
    "france3": {
      pattern: "TV france 3",
      command: "france3"
    },
    "france4": {
      pattern: "TV france 4",
      command: "france4"
    },
    "france5": {
      pattern: "TV france 5",
      command: "france5"
    },
    "arte": {
      pattern: "TV arte",
      command: "arte"
    },
    "c8": {
      pattern: "TV c8",
      command: "c8"
    },
    "nrj12": {
      pattern: "TV nrj12",
      command: "nrj12"
    },
    "lcp": {
      pattern: "TV lcp",
      command: "lcp"
    },
    "bfmtv": {
      pattern: "TV bfm tv",
      command: "bfmtv"
    },
    "cnews": {
      pattern: "TV cnews",
      command: "cnews"
    },
    "cstar": {
      pattern: "TV cstar",
      command: "cstar"
    },
    "gulli": {
      pattern: "TV gulli",
      command: "gulli"
    },
    "equipe": {
      pattern: "TV l'équipe",
      command: "equipe"
    },
    "rmcstory": {
      pattern: "TV RMC story",
      command: "rmcstory"
    },
    "rmcdecouverte": {
      pattern: "TV RMC découverte",
      command: "rmcdecouverte"
    },
    "cherie25": {
      pattern: "TV chérie 25",
      command: "cherie25"
    },
    "franceinfo": {
      pattern: "TV France Info",
      command: "franceinfo"
    },
    "parispremiere": {
      pattern: "TV Paris Première",
      command: "parispremiere"
    },
    "RTL9": {
      pattern: "TV RTL9",
      command: "rtl9"
    },
    "gameone": {
      pattern: "TV Game One",
      command: "gameone"
    },
    "AB1": {
      pattern: "TV AB1",
      command: "AB1"
    },
    "teva": {
      pattern: "TV Téva",
      command: "teva"
    },
    "m6music": {
      pattern: "TV M6 Music",
      command: "m6music"
    },
    "mcm": {
      pattern: "TV MCM",
      command: "mcm"
    },
    "mangas": {
      pattern: "TV Mangas",
      command: "mangas"
    },
    "equidia": {
      pattern: "TV Equidia",
      command: "equidia"
    },
    "automoto": {
      pattern: "TV Automoto",
      command: "automoto"
    },
    "rfmtv": {
      pattern: "TV RFM TV",
      command: "rfmtv"
    }
  },

  commands: {
    "france2": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "France2"
      },
      soundExec: {
        chime: "open"
      }
    },
    "france3": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "France3"
      },
      soundExec: {
        chime: "open"
      }
    },
    "france4": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "France4"
      },
      soundExec: {
        chime: "open"
      }
    },
    "france5": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "France5"
      },
      soundExec: {
        chime: "open"
      }
    },
    "arte": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "ARTE"
      },
      soundExec: {
        chime: "open"
      }
    },
    "c8": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "C8"
      },
      soundExec: {
        chime: "open"
      }
    },
    "nrj12": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "NRJ12"

      },
      soundExec: {
        chime: "open"
      }
    },
    "lcp": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "LCP"
      },
      soundExec: {
        chime: "open"
      }
    },
    "bfmtv": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "BFMTV"
      },
      soundExec: {
        chime: "open"
      }
    },
    "cnews": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "CNews"
      },
      soundExec: {
        chime: "open"
      }
    },
    "cstar": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "CStar"
      },
      soundExec: {
        chime: "open"
      }
    },
    "gulli": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "Gulli"
      },
      soundExec: {
        chime: "open"
      }
    },
    "equipe": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "Equipe"
      },
      soundExec: {
        chime: "open"
      }
    },
    "rmcstory": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "RMCStory"
      },
      soundExec: {
        chime: "open"
      }
    },
    "rmcdecouverte": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "RMCDecouverte"
      },
      soundExec: {
        chime: "open"
      }
    },
    "cherie25": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "Cherie25"
      },
      soundExec: {
        chime: "open"
      }
    },
    "franceinfo": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "FranceInfo"
      },
      soundExec: {
        chime: "open"
      }
    },
    "parispremiere": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "ParisPremiere"
      },
      soundExec: {
        chime: "open"
      }
    },
    "rtl9": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "RTL9"
      },
      soundExec: {
        chime: "open"
      }
    },
    "gameone": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "GameOne"
      },
      soundExec: {
        chime: "open"
      }
    },
    "AB1": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "AB1"
      },
      soundExec: {
        chime: "open"
      }
    },
    "teva": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "TEVA"
      },
      soundExec: {
        chime: "open"
      }
    },
    "m6music": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "M6Music"
      },
      soundExec: {
        chime: "open"
      }
    },
    "mcm": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "MCM"
      },
      soundExec: {
        chime: "open"
      }
    },
    "mangas": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "Mangas"
      },
      soundExec: {
        chime: "open"
      }
    },
    "equidia": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "Equidia"
      },
      soundExec: {
        chime: "open"
      }
    },
    "automoto": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "AutoMoto"
      },
      soundExec: {
        chime: "open"
      }
    },
    "rfmtv": {
      notificationExec: {
        notification: "EXT_FREEBOXTV-PLAY",
        payload: "RFMTV"
      },
      soundExec: {
        chime: "open"
      }
    },
    "stop": {
      notificationExec: {
        notification: "EXT_FreeboxTV-STOP"
      },
      soundExec: {
        chime: "close"
      }
    },
    "VOLUMETV": {
      notificationExec: {
        notification: "EXT_FreeboxTV-VOLUME",
        payload: (params) => {
          return params[1]
        }
      }
    }
  }
}
exports.recipe = recipe
