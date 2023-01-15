/* Magic Mirror
 * Node Helper: EXT-FreeboxTV
 */

var NodeHelper = require("node_helper")
const fs = require('fs')
const path = require("path")
var Cvlc = require('@bugsounet/cvlc')
var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({

  start: function() {
    this.stream= null
    this.FreeboxTV= {}
    this.ID = 0
    this.volumeControl = null
    this.Channels = []
  },

  socketNotificationReceived: function(notification, payload) {
    switch(notification) {
      case "CONFIG":
        console.log("[FreeboxTV] EXT-FreeboxTV Version:",  require('./package.json').version)
        this.config = payload
        this.scanStreamsConfig()
        if (this.config.debug) log = (...args) => { console.log("[FreeboxTV]", ...args) }
        console.log("[FreeboxTV] FreeboxTV is initialized.")
        log("Config:", this.config)
        this.sendSocketNotification("INITIALIZED", this.Channels)
        break
      case "PLAY":
        this.startPlayer(payload)
        break
      case "STOP":
        this.stopPlayer()
        break
      case "VOLUME_CONTROL":
        this.volume(payload)
        break
      case "VOLUME_LAST":
        this.volumeControl = payload
        break
    }
  },

  stop: function() {
    log("Stop TV...")
    this.stopPlayer()
  },

  startPlayer: function(name) {
    this.ID++

    if (!this.FreeboxTV[name]) return log ("Channel not found:", name)
    var link = this.FreeboxTV[name]
    // Generate the VLC window
    var args = ["--video-on-top", "--no-video-title-show", "--no-video-deco", "--no-embedded-video", "--video-title=FreeboxTV", "--fullscreen"]

    this.stream = new Cvlc(args)
    log("Starting channel:", name)
    this.stream.play(
      link,
      ()=> {
        log("Found link:", link)
         if (this.stream) {
           this.volume(this.volumeControl ? this.volumeControl: this.config.volume.start)
           this.sendSocketNotification("STARTED")
        }
      },
      ()=> {
        this.ID--
        if (this.ID < 0) this.ID = 0
        log("Video ended")
        if (this.ID == 0) {
          log("Finish !")
          this.stream = null
          this.sendSocketNotification("ENDED")
        }
      }
    )
  },

  stopPlayer: function() {
    if (this.stream) {
      this.stream.destroy()
      log("Stop streaming")
    }
  },

  scanStreamsConfig: function() {
    console.log("[FreeboxTV] Reading:", this.config.streams)
    let file = path.resolve(__dirname, this.config.streams)
    if (fs.existsSync(file)) {
      try {
        this.FreeboxTV = JSON.parse(fs.readFileSync(file))
        console.log("[FreeboxTV] Channels:", this.FreeboxTV)
        console.log("[FreeboxTV] Number of channels found:", Object.keys(this.FreeboxTV).length)
        this.Channels = Object.keys(this.FreeboxTV)
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
