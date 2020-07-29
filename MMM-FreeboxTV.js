/* MMM-FreeboxTV */

Module.register("MMM-FreeboxTV", {
    defaults: {
      debug: false,
      autoReplay: true,
      fullcreen: false,
      width: 384,
      height: 216,
      moduleOffset: 0,
      onStart: null,
      onStartDelay: 10000
    },

    start: function() {
      this.FreeboxTV = {
        playing: false,
        channel: null,
        suspended: false
      }
      this.moduleWidth= this.config.width + 6
      this.moduleHeight= this.config.height + 6
      this.Channels = {}
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
          this.notificationReceived("TV-PLAY", this.FreeboxTV.channel)
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
      wrapper.className = "MMM-FreeboxTV wrapper"
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
      canvas.className = "MMM-FreeboxTV canvas"
      return canvas
    },

    getInnerWrapper: function() {
      var innerWrapper = document.createElement("div")
      innerWrapper.className = "MMM-FreeboxTV innerWrapper"
      innerWrapper.style.cssText = this.getCanvasSize( { "width": this.config.width, "height": this.config.height })
      innerWrapper.id = "iw_TV"
      return innerWrapper
    },

    playStream: function(channel,fullscreen = false) {
      var canvasId = "canvas_TV"
      var canvas = document.getElementById(canvasId)

      if (this.FreeboxTV.playing) {
        this.stopStream()
      }

      var rect = canvas.getBoundingClientRect()
      var offset = {}
      var payload = { name: channel }
      if (typeof this.config.moduleOffset === "object") {
        offset.left = ("left" in this.config.moduleOffset) ? this.config.moduleOffset.left : 0
        offset.top = ("top" in this.config.moduleOffset) ? this.config.moduleOffset.top : 0
      } else {
        offset.left = this.config.moduleOffset
        offset.top = this.config.moduleOffset
      }
      var box = {};
      if (fullscreen) {
        payload.fullscreen = true
      } else {
        box = {
          top: Math.round(rect.top + offset.top), // Compensate for Margins
          right: Math.round(rect.right + offset.left), // Compensate for Margins
          bottom: Math.round(rect.bottom + offset.top), // Compensate for Margins
          left: Math.round(rect.left + offset.left) // Compensate for Margins
        }
      }
      payload.box = box

      if (!this.FreeboxTV.suspended) {
        this.sendSocketNotification("PLAY", payload)
      }
      this.sendNotification("A2D_LOCK")
      this.FreeboxTV.playing = true
      this.FreeboxTV.channel = channel
    },

    stopStream: function(force) {
      if (this.FreeboxTV.playing) {
        this.sendSocketNotification("STOP")
        this.sendNotification("A2D_UNLOCK")
        this.FreeboxTV.playing = false
        if (!this.FreeboxTV.suspended)
          this.FreeboxTV.channel= null
      }
      if (force) {
        this.FreeboxTV.playing = false
        this.FreeboxTV.channel = null
        this.FreeboxTV.suspended = false
      }
    },

    getStyles: function() {
      return ["MMM-FreeboxTV.css"]
    },

    notificationReceived: function(notification, payload) {
      switch(notification) {
        case "DOM_OBJECTS_CREATED":
          this.sendSocketNotification("CONFIG", this.config)
          break
        case "TV-PLAY":
          this.playStream(payload,this.config.fullscreen)
          break
        case "TV-STOP":
          this.stopStream(true)
          break
      }
    },

    socketNotificationReceived: function(notification, payload) {
      if (notification == "INITIALIZED") {
        this.Channels = payload
        if (this.config.onStart) {
          if (this.ChannelsCheck(this.config.onStart)) {
            console.log("[FreeboxTV] onStart: Lancemement de la chaine " + this.config.onStart + " dans " + this.config.onStartDelay / 1000 + " Sec")
            setTimeout(() => this.playStream(this.config.onStart,this.config.fullscreen), this.config.onStartDelay)
          }
          else console.log("[FreeboxTV] onStart: Chaine non trouvé", this.config.onStart)
        }
      }
    },

    /** Telegram Addon **/
    getCommands: function(commander) {
      commander.add({
        command: "TV",
        description: "Lance un chaine de FreeboxTV",
        callback: "TV"
      })
    },

    TV: function(command, handler) {
      if (handler.args) {
        if (this.ChannelsCheck(handler.args)) {
          this.playStream(handler.args,this.config.fullscreen)
          return handler.reply("TEXT", "J'affiche la chaine: " + handler.args)
        } else return handler.reply("TEXT", "Chaine non trouvé: " + handler.args)
      }
      this.stopStream(true)
      handler.reply("TEXT", "J'éteins la TV")
    },

    ChannelsCheck: function (channel) {
      if (this.Channels.hasOwnProperty(channel)) return true
      return false
    }
});
