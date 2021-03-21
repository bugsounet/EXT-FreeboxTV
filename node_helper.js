/* Magic Mirror
 * Node Helper: MMM-FreeboxTV
 */

var NodeHelper = require("node_helper")
const fs = require('fs')
const path = require("path")
const child_process = require('child_process')
var Cvlc = require('@bugsounet/cvlc')
const npmCheck = require("@bugsounet/npmcheck")
const environ = Object.assign(process.env, { DISPLAY: ":0" })
var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({

  start: function() {
    this.stream= null,
    this.FreeboxTV= {}
    this.ID = 0
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'CONFIG') {
      console.log("[FreeboxTV] MMM-FreeboxTV Version:",  require('./package.json').version)
      this.config = payload
      this.scanStreamsConfig()
      if (this.config.debug) log = (...args) => { console.log("[FreeboxTV]", ...args) }
      if (this.config.NPMCheck.useChecker) {
        var cfg = {
          dirName: __dirname,
          moduleName: this.name,
          timer: this.config.NPMCheck.delay,
          debug: this.config.debug
        }
        this.Checker= new npmCheck(cfg, update => { this.sendSocketNotification("NPM_UPDATE", update)} )
      }
      console.log("[FreeboxTV] FreeboxTV is initialized.")
      this.sendSocketNotification("INITIALIZED", this.FreeboxTV)
    }
    if (notification === "PLAY") this.startPlayer(payload)
    if (notification === "STOP") this.stopPlayer()
    if (notification === "VOLUME_CONTROL") this.volume(payload)
  },

  stop: function() {
    log("Arrêt du flux TV...")

    // Kill VLC Stream
    if (this.dp2) {
      log("Killing DevilsPie2...")
      this.dp2.stderr.removeAllListeners()
      this.dp2.kill()
      this.dp2 = undefined
    }
    this.stopPlayer()
  },

  startPlayer: function(payload) {
    var positions = {}
    let dp2Check = false
    var TV = payload
    var fullscreen = false
    this.ID++

    if (!this.FreeboxTV[TV.name]) return log ("Chaine non trouvé:", TV.name)
    var link = this.FreeboxTV[TV.name]
    // Generate the VLC window
    var args = ['--video-on-top', "--no-video-title-show", "--no-video-deco", "--no-embedded-video", "--video-title=FreeboxTV"]
    if ("fullscreen" in TV) {
      args.unshift("--fullscreen")
      fullscreen = true
    } else {
      args.unshift("--width", TV.box.right - TV.box.left, "--height", TV.box.bottom - TV.box.top)
      positions = `${TV.box.left}, ${TV.box.top}, ${TV.box.right-TV.box.left}, ${TV.box.bottom-TV.box.top}`
      dp2Check = true
    }
    this.stream = new Cvlc(args)
    log("Démarrage " + (fullscreen ? "plein écran " : "") + `de la chaine ${TV.name}...`)
    this.stream.play(
      link,
      ()=> {
        log("Found link:", link)
         if (this.stream) this.volume(255)
      },
      ()=> {
        this.ID--
        if (this.ID < 0) this.ID = 0
        log("Video ended")
        if (this.ID == 0) {
          log("Finish !")
          this.stream = null
        }
      }
    )
    if (!dp2Check) return
    var opts = { detached: false, env: environ, stdio: ['ignore', 'ignore', 'pipe'] }
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
        console.log('[FreeboxTV] DP2: Failed to start.')
      })
    }

    fs.readFile(path.resolve(__dirname + '/scripts/vlc.lua'), "utf8", (err, data) => {
      if (err) throw err

      // Only write the new DevilsPie2 config if we need to.
      if (data !== dp2Config) {
        fs.writeFile(path.resolve(__dirname + '/scripts/vlc.lua'), dp2Config, (err) => {
          // throws an error, you could also catch it here
          if (err) throw err

          log('DP2: Config File Saved!')
          startDp2()
          // Give the windows time to settle, then re-call to resize again.
          setTimeout(() => { startDp2(); }, 5000)
        });
      } else {
        startDp2()
        setTimeout(() => { startDp2(); }, 5000)
      }
    })
  },

  stopPlayer: function() {
    if (this.stream) {
      this.stream.destroy()
      log("Arrêt de la diffusion")
    }
  },

  scanStreamsConfig: function() {
    console.log("[FreeboxTV] Reading:", this.config.streams)
    let file = path.resolve(__dirname, this.config.streams)
    if (fs.existsSync(file)) {
      try {
        this.FreeboxTV = JSON.parse(fs.readFileSync(file))
        console.log("[FreeboxTV] Number of channels found:", Object.keys(this.FreeboxTV).length)
      } catch (e) {
        return console.log("[FreeboxTV] ERROR: " + this.config.streams, e.name)
      }
    } else console.log("[FreeboxTV] ERROR: missing " + this.config.streams + " configuration file!")
  },

  volume: function(volume) {
    if (this.stream) {
      log("Set VLC Volume to:", volume)
      this.stream.cmd("volume " + volume)
    }
  }
});
