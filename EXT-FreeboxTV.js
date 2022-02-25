/* EXT-FreeboxTV */
/** @todo: control if everything is ok **/

Module.register("EXT-FreeboxTV", {
    defaults: {
      debug: true,
      autoReplay: true,
      fullcreen: false,
      width: 384,
      height: 216,
      onStart: null,
      onStartDelay: 10000,
      streams: "streamsConfig.json",
      volume: {
        start: 100,
        min: 30,
        useLast: true
      }
    },

    start: function() {
      this.FreeboxTV = {
        playing: false,
        channel: null,
        suspended: false
      }
      this.volumeControl= null
      this.moduleWidth= this.config.width + 6
      this.moduleHeight= this.config.height + 6
      this.Channels = {}
      this.initializeVolume()
    },

    /* suspend()
     * This method is called when a module is hidden.
     */
    suspend: function() {
      console.log(`[FreeboxTV] ${this.name} is suspended...`)
      this.FreeboxTV.suspended = true
      this.stopStream()
    },

    resumed: function(callback) {
      console.log(`[FreeboxTV] ${this.name} has resumed... autoReplay: ${this.config.autoReplay}`)
      if (this.FreeboxTV.suspended && this.config.autoReplay && this.FreeboxTV.channel) {
          this.FreeboxTV.suspended = false
          this.notificationReceived("EXT_FreeboxTV-PLAY", this.FreeboxTV.channel)
      } else this.FreeboxTV.suspended = false
      if (typeof callback === "function") { callback() }
    },

    // Overwrite the module show method to force a callback.
    show: function(speed, callback, options) {
      if (typeof callback === "object") {
        options = callback
        callback = function() {}
      }

      newCallback = () => { this.resumed(callback) }
      options = options || {}

      MM.showModule(this, speed, newCallback, options)
    },

    getDom: function() {
      var wrapper = document.createElement("div")

      wrapper.style.cssText = `width: ${this.moduleWidth}px; height:${this.moduleHeight}px`
      wrapper.className = "EXT-FreeboxTV wrapper"
      if (this.config.fullscreen) wrapper.classList.add("hidden")
      iw = this.getInnerWrapper()
      iw.appendChild(this.getCanvas())
      wrapper.appendChild(iw)

      return wrapper
    },

    getCanvasSize: function(streamConfig) {
      var s = ''
      if (typeof streamConfig.width !== "undefined") { s += "width: " + streamConfig.width + "px; "; }
      if (typeof streamConfig.height !== "undefined") { s += "height: " + streamConfig.height + "px; line-height: " + streamConfig.height + ";"; }
      return s
    },

    getCanvas: function() {
      var canvas = document.createElement("canvas")
      canvas.id = "canvas_TV"
      canvas.className = "EXT-FreeboxTV canvas"
      return canvas
    },

    getInnerWrapper: function() {
      var innerWrapper = document.createElement("div")
      innerWrapper.className = "EXT-FreeboxTV innerWrapper"
      innerWrapper.style.cssText = this.getCanvasSize( { "width": this.config.width, "height": this.config.height })
      innerWrapper.id = "iw_TV"
      return innerWrapper
    },

    playStream: function(channel,fullscreen = false) {
      var canvasId = "canvas_TV"
      var canvas = document.getElementById(canvasId)

      if (this.FreeboxTV.playing) this.stopStream()

      var rect = canvas.getBoundingClientRect()
      var payload = { name: channel }
      var box = {};
      if (fullscreen) payload.fullscreen = true
      else {
        box = {
          top: Math.round(rect.top), // Compensate for Margins
          right: Math.round(rect.right), // Compensate for Margins
          bottom: Math.round(rect.bottom), // Compensate for Margins
          left: Math.round(rect.left) // Compensate for Margins
        }
      }
      payload.box = box

      if (!this.FreeboxTV.suspended) this.sendSocketNotification("PLAY", payload)
      //this.sendNotification("EXT_LOCK")
      this.FreeboxTV.playing = true
      this.FreeboxTV.channel = channel
      this.sendNotification("EXT_FREEBOXTV-CONNECTED")
    },

    stopStream: function(force) {
      if (this.FreeboxTV.playing) {
        this.sendSocketNotification("STOP")
        this.FreeboxTV.playing = false
        if (!this.FreeboxTV.suspended) this.FreeboxTV.channel= null
        this.sendNotification("EXT_FREEBOXTV-DISCONNECTED")
      }
      if (force) {
        this.FreeboxTV.playing = false
        this.FreeboxTV.channel = null
        this.FreeboxTV.suspended = false
      }
    },

    getStyles: function() {
      return ["EXT-FreeboxTV.css"]
    },

    notificationReceived: function(notification, payload) {
      switch(notification) {
        case "DOM_OBJECTS_CREATED":
          this.sendSocketNotification("CONFIG", this.config)
          this.sendNotification("EXT_HELLO", this.name)
          break
        case "EXT_FreeboxTV-FULLSCREEN":
          if (!this.config.fullscreen) this.sendSocketNotification("TV-FULLSCREEN")
          break
        case "EXT_FreeboxTV-WINDOWS":
          if (!this.config.fullscreen) this.sendSocketNotification("TV-WINDOWS")
          break
        case "EXT_FreeboxTV-PLAY":
          this.playStream(payload,this.config.fullscreen)
          break
        case "EXT_STOP":
        case "EXT_FreeboxTV-STOP":
          this.stopStream(true)
          break
        /*
        case "ALEXA_ACTIVATE":
        case "ASSISTANT_LISTEN":
        case "ASSISTANT_THINK":
          if (this.FreeboxTV.playing) this.sendSocketNotification("VOLUME_CONTROL", this.config.volume.min)
          break
        case "ALEXA_STANDBY":
        case "ASSISTANT_STANDBY":
          if (this.FreeboxTV.playing) this.sendSocketNotification("VOLUME_CONTROL", this.volumeControl ? this.volumeControl : this.config.volume.start)
          break
        */
        case "EXT_FreeboxTV-VOLUME":
          let value = null
          if (payload) value = parseInt(payload)
          if (typeof value === "number" && value >= 0 && value <= 100) {
            this.volumeControl = ((value * 255) / 100).toFixed(0)
            if (this.config.volume.useLast) this.sendSocketNotification("VOLUME_LAST", this.volumeControl)
            if (this.FreeboxTV.playing) this.sendSocketNotification("VOLUME_CONTROL", this.volumeControl)
            console.log("[FreeboxTV] Volume:", this.volumeControl, "[" + value + "]")
          } else console.log("[FreeboxTV] Volume Control wrong value:", payload)
          break
      }
    },

    socketNotificationReceived: function(notification, payload) {
      if (notification == "INITIALIZED") {
        this.Channels = payload
        if (this.config.onStart) {
          if (this.ChannelsCheck(this.config.onStart)) {
            console.log("[FreeboxTV] onStart: Launching: " + this.config.onStart + " in " + this.config.onStartDelay / 1000 + " Sec")
            setTimeout(() => this.playStream(this.config.onStart,this.config.fullscreen), this.config.onStartDelay)
          }
          else console.log("[FreeboxTV] onStart: Channel not found", this.config.onStart)
        }
        console.log("[FreeboxTV] Ready, the show must go on!")
      }
    },

    getTranslations: function() {
      return {
        en: "translations/en.json",
        fr: "translations/fr.json",
      }
    },

    /** Telegram Addon **/
    getCommands: function(commander) {
      commander.add({
        command: "TV",
        description: this.translate("FBTV_TV"),
        callback: "TV"
      })
      commander.add({
        command: "TVol",
        description: this.translate("FBTV_TVOL"),
        callback: "TVol"
      })
      if (!this.config.fullscreen) {
        commander.add({
          command: "TVFull",
          description: this.translate("FBTV_TVFULL"),
          callback: "TVFull"
        })
        commander.add({
          command: "TVWin",
          description: this.translate("FBTV_TVWIN"),
          callback: "TVWin"
        })
      }
    },

    TV: function(command, handler) {
      if (handler.args) {
        if (this.ChannelsCheck(handler.args)) {
          this.sendNotification("WAKEUP")
          this.playStream(handler.args,this.config.fullscreen)
          return handler.reply("TEXT", this.translate("FBTV_TV_DISPLAY") + handler.args)
        } else return handler.reply("TEXT", this.translate("FBTV_TV_NOTFOUND") + handler.args)
      }
      this.stopStream(true)
      handler.reply("TEXT", this.translate("FBTV_TV_DOWN"))
    },

    TVol: function(command, handler) {
      if (handler.args) {
        let value = null
        value = parseInt(handler.args)
        if (typeof value === "number" && value >= 0 && value <= 100) {
          this.volumeControl = ((value * 255) / 100).toFixed(0)
          if (this.config.volume.useLast) this.sendSocketNotification("VOLUME_LAST", this.volumeControl)
          this.sendSocketNotification("VOLUME_CONTROL", this.volumeControl)
          console.log("[FreeboxTV] Volume:", this.volumeControl, "[" + value + "]")
          return handler.reply("TEXT", this.translate("FBTV_TVOL_SET") + handler.args + "%")
        }
      }
      else return handler.reply("TEXT", this.translate("FBTV_TVOL_RULE"))
    },

    TVFull: function(command, handler) {
      if (this.FreeboxTV.playing) {
        this.sendSocketNotification("TV-FULLSCREEN")
        handler.reply("TEXT", this.translate("FBTV_TV_FULL"))
      } else handler.reply("TEXT", this.translate("FBTV_TV_ERR"))
    },

    TVWin: function(command, handler) {
      if (this.FreeboxTV.playing) {
        this.sendSocketNotification("TV-WINDOWS")
        handler.reply("TEXT", this.translate("FBTV_TV_WIN"))
      } else handler.reply("TEXT", this.translate("FBTV_TV_ERR"))
    },

    ChannelsCheck: function (channel) {
      if (this.Channels.hasOwnProperty(channel)) return true
      return false
    },

    initializeVolume: function() {
      /** convert volume **/
      try {
        let valueStart = null
        valueStart = parseInt(this.config.volume.start)
        if (typeof valueStart === "number" && valueStart >= 0 && valueStart <= 100) this.config.volume.start = ((valueStart * 255) / 100).toFixed(0)
        else {
          console.error("[FreeboxTV] config.volume.start error! Corrected with 100")
          this.config.volume.min = 255
        }
      } catch (e) {
        console.error("[FreeboxTV] config.volume.start error!", e)
        this.config.volume.min = 255
      }
      try {
        let valueMin = null
        valueMin = parseInt(this.config.volume.min)
        if (typeof valueMin === "number" && valueMin >= 0 && valueMin <= 100) this.config.volume.min = ((valueMin * 255) / 100).toFixed(0)
        else {
          console.error("[FreeboxTV] config.volume.min error! Corrected with 30")
          this.config.volume.min = 70
        }
      } catch (e) {
        console.error("[FreeboxTV] config.volume.min error!", e)
        this.config.volume.min = 70
      }
      console.log("[FreeboxTV] Volume Control initialized!")
    }
});
