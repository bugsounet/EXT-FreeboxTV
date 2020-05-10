/* Magic Mirror
 * Node Helper: MMM-FreeboxTV
 */

var NodeHelper = require("node_helper");
const fs = require('fs');
const path = require("path");
const child_process = require('child_process');
const environ = Object.assign(process.env, { DISPLAY: ":0" });
var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({

  omxStream: {},
  vlcStream: {},
  FreeboxTV: {
    "2": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=201&flavour=sd",
    "3": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=202&flavour=sd",
    "5": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=203&flavour=sd",
    "7": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=204&flavour=sd",
    "8": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=372&flavour=sd",
    "12": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=375&flavour=ld",
    "13": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=226&flavour=sd",
    "14": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=376&flavour=sd",
    "15": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=400&flavour=sd",
    "16": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=679&flavour=sd",
    "17": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=678&flavour=sd",
    "18": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=677", // full screen only
    "19": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=238&flavour=sd",
    "21": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=994&flavour=ld",
    "23": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=996&flavour=ld",
    "24": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=997&flavour=ld",
    "25": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=998&flavour=ld",
    "27": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=1173&flavour=ld",
    "28": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=213&flavour=ld",
    "29": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=210&flavour=ld",
    "47": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=1426&flavour=ld",
    "50": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=220&flavour=sd",
    "51": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=211&flavour=ld",
    "52": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=1050&flavour=ld",
    "53": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=404&flavour=ld",
    "64": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=430&flavour=ld",
    "70": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=206&flavour=sd",
    "87": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=621&flavour=sd",
    "89": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=979&flavour=ld",
    "90": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=253&flavour=ld",
    "91": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=1309&flavour=ld",
    "94": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=1045&flavour=ld",
    "95": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=813&flavour=sd",
    "96": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=618&flavour=sd",
    "97": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=1318&flavour=ld",
    "99": "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=1135&flavour=ld"
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'CONFIG') {
      this.config = payload
      if (this.config.debug) log = (...args) => { console.log("[FreeboxTV]", ...args) }
      this.sendSocketNotification("STARTED")
      log("Configured")
    }
    if (notification === "PLAY_VLCSTREAM") {
      this.getVlcPlayer(payload)
    }
    if (notification === "STOP_VLCSTREAM") {
      this.stopVlcPlayer()
    }

    if (notification === "PLAY_OMXSTREAM") {
      this.getOmxplayer(payload)
    }
    if (notification === "STOP_OMXSTREAM") {
      this.stopOmxplayer(payload)
    }
    if (notification === "STOP_ALL_OMXSTREAMS") {
      if (Object.keys(this.omxStream).length > 0) {
        this.stopAllOmxplayers()
      }
    }
  },

  start: function() {
    console.log("[FreeboxTV] Starts...")
  },

  stop: function() {
    log("Arrêt du flux TV... " + this.config.localPlayer)

    // Kill OMX Stream
    if (this.config.localPlayer === "omxplayer") {
      this.stopOmxplayer()
    }

    // Kill VLC Stream
    if (this.config.localPlayer === "vlc") {
      if (this.dp2) {
        log("Killing DevilsPie2...")
        this.dp2.stderr.removeAllListeners()
        this.dp2.kill()
        this.dp2 = undefined
      }
      this.stopVlcPlayer()
    }
  },

  getVlcPlayer: function(payload) {
    var opts = { detached: false, env: environ, stdio: ['ignore', 'ignore', 'pipe'] }
    var vlcCmd = `cvlc`
    var positions = {}
    let dp2Check = false
    var TV = payload
    var fullscreen = false

    // Abort a single delayed shutdown, if there was one.
    if (TV.name in this.vlcStream) {
      console.log(this.vlcStream)
      child_process.exec(`wmctrl -r FreeboxTV -b remove,hidden && wmctrl -a FreeboxTV`, { env: environ }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`)
          return
        }
      })
      return
    } else {
      if (!this.FreeboxTV[TV.name]) return log ("Chaine non trouvé:", TV.name)
      // Otherwise, Generate the VLC window
      var args = ["-I", "dummy", '--video-on-top', "--no-video-deco", "--no-embedded-video", "--video-title=FreeboxTV",
          this.FreeboxTV[TV.name]
      ]
      if ("fullscreen" in TV) {
        args.unshift("--fullscreen")
        fullscreen = true
      } else {
        args.unshift("--width", TV.box.right - TV.box.left, "--height", TV.box.bottom - TV.box.top)
        positions = `${TV.box.left}, ${TV.box.top}, ${TV.box.right-TV.box.left}, ${TV.box.bottom-TV.box.top}`
        dp2Check = true
      }
      log("Démarrage " + (fullscreen ? "plein écran " : "") + `de la chaine ${TV.name} (utilisation de VLC avec arguments: ${args.join(' ')}...`)

      this.vlcStream.FreeboxTV = child_process.spawn(vlcCmd, args, opts)

      this.vlcStream.FreeboxTV.on('error', (err) => {
        console.error("Impossible de démarrer le processus vlc: " +err)
      })
    }
    if (!dp2Check) { return; }
    var dp2Cmd = `devilspie2`
    var dp2Args = ['--debug', '-f', path.resolve(__dirname + '/scripts')]
    let dp2Config =`
if (get_window_name()=="FreeboxTV") then
  set_window_geometry(${positions});
  undecorate_window();
  set_on_top();
  make_always_on_top();
end
`;

    var startDp2 = () => {
      if (this.dp2) {
        this.dp2.stderr.removeAllListeners()
        this.dp2.kill()
        this.dp2 = undefined
      }
      log("DP2: Running window resizers...")
      this.dp2 = child_process.spawn(dp2Cmd, dp2Args, opts)
      this.dp2.on('error', (err) => {
        console.error('DP2: Failed to start.')
      });
    };

    fs.readFile(path.resolve(__dirname + '/scripts/vlc.lua'), "utf8", (err, data) => {
      if (err) throw err

      // Only write the new DevilsPie2 config if we need to.
      if (data !== dp2Config) {
        fs.writeFile(path.resolve(__dirname + '/scripts/vlc.lua'), dp2Config, (err) => {
          // throws an error, you could also catch it here
          if (err) throw err

          log('DP2: Config File Saved!')
          if (this.config.debug) { console.log(dp2Config) }
          startDp2()
          // Give the windows time to settle, then re-call to resize again.
          setTimeout(() => { startDp2(); }, 5000)
        });
      } else {
        startDp2()
        setTimeout(() => { startDp2(); }, 5000)
      }
    });
  },

  stopVlcPlayer: function() {
    if ("FreeboxTV" in this.vlcStream) {
      log("-VLC- Arrêt de la diffusion")
      try {
        this.vlcStream.FreeboxTV.stderr.removeAllListeners()
        this.vlcStream.FreeboxTV.kill()
      } catch (err) {
        console.log(err)
      }
      delete this.vlcStream.FreeboxTV
    }
  },

  getOmxplayer: function(payload) {
    console.log("OmxStart")
    var fullscreen = false
    var opts = { detached: false, stdio: 'ignore' };

    var omxCmd = `omxplayer`;

    var namesM = [];

    var argsM = [];
    var TV = payload

    var args = ["--live", "--video_queue", "4", "--fps", "30", "--no-osd",
      this.FreeboxTV[TV.name]
    ];
    if (!("fullscreen" in TV)) {
      args.unshift("--win", `${TV.box.left},${TV.box.top},${TV.box.right},${TV.box.bottom}`);
      fullscreen = true
    }
    if (this.config.protocol !== "udp") {
      args.unshift("--avdict", "rtsp_transport:tcp");
    }

    if ("rotateDegree" in this.config && this.config.rotateDegree) {
      args.unshift("--orientation", this.config.rotateDegree);
      args.unshift("--aspect-mode", "stretch");
    }
    if (this.config.debug) {
        args.unshift("-I");
    }
    log("Démarrage " + (fullscreen ? "plein écran " : "") + `de la chaine ${TV.name} (utilisation de omxplayer avec arguments: ${args.join(' ')}...`)
    this.omxStream.FreeboxTV = child_process.spawn(omxCmd, args, opts);
    this.omxStream.FreeboxTV.on('error', (err) => {
      console.error("Impossible de démarrer le processus omxPlayer: " + err)
    })
  },

  stopOmxplayer: function(name, callback) {
    if ("FreeboxTV" in this.omxStream) {
      log("-omxplayer- Arrêt de la diffusion")
      try {
        this.omxStream.FreeboxTV.stderr.removeAllListeners()
        this.omxStream.FreeboxTV.kill()
      } catch (err) {
        console.log(err)
      }
      delete this.omxStream.FreeboxTV
    }
  },

});
