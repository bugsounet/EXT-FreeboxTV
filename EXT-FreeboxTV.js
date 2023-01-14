/* EXT-FreeboxTV */

Module.register("EXT-FreeboxTV", {
    defaults: {
      debug: false,
      fullscreen: false,
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
        last: 9999
      }
      this.volumeControl= null
      this.Channels = []
      this.initializeVolume()
    },

    getDom: function() {
      var wrapper = document.createElement("div")
      wrapper.classList.add("hidden")
      return wrapper
    },

    playStream: function(channel) {
      if (!this.ChannelsCheck(channel)) return console.log("channel not found")
      if (this.FreeboxTV.playing) this.stopStream()
      this.sendSocketNotification("PLAY", channel)
      this.FreeboxTV.playing = true
      this.FreeboxTV.channel = channel
      this.FreeboxTV.last = this.Channels.indexOf(channel)
      this.sendNotification("EXT_FREEBOXTV-CONNECTED")
    },

    playNextStream: function() {
      var last = this.FreeboxTV.last
      var channel = this.Channels.next(last)
      if (!channel) channel = this.Channels[0]
      this.playStream(channel)
    },

    playPreviousStream: function() {
      var last = this.FreeboxTV.last
      var channel = this.Channels.prev(last)
      if (!channel) channel = this.Channels[this.Channels.length-1]
      this.playStream(channel)  
    },

    stopStream: function(force) {
      if (this.FreeboxTV.playing) {
        this.sendSocketNotification("STOP")
        this.FreeboxTV.playing = false
        this.FreeboxTV.channel= null
        this.sendNotification("EXT_FREEBOXTV-DISCONNECTED")
      }
      if (force) {
        this.FreeboxTV.playing = false
        this.FreeboxTV.channel = null
      }
    },

    notificationReceived: function(notification, payload, sender) {
      switch(notification) {
        case "DOM_OBJECTS_CREATED":
          this.sendSocketNotification("CONFIG", this.config)
          break
        case "GAv4_READY":
          if (sender.name == "MMM-GoogleAssistant") this.sendNotification("EXT_HELLO", this.name)
          break
        case "EXT_FREEBOXTV-PLAY":
          this.playStream(payload)
          break
        case "EXT_FREEBOXTV-NEXT":
          this.playNextStream(payload)
          break
        case "EXT_FREEBOXTV-PREVIOUS":
          this.playPreviousStream(payload)
          break
        case "EXT_STOP":
        case "EXT_FREEBOXTV-STOP":
          this.stopStream(true)
          break
        case "EXT_FREEBOXTV-VOLUME":
          let value = null
          if (payload) value = parseInt(payload)
          if (typeof value === "number" && value >= 0 && value <= 100) {
            this.volumeControl = ((value * 255) / 100).toFixed(0)
            if (this.config.volume.useLast) this.sendSocketNotification("VOLUME_LAST", this.volumeControl)
            if (this.FreeboxTV.playing) this.sendSocketNotification("VOLUME_CONTROL", this.volumeControl)
            console.log("[FreeboxTV] Volume:", this.volumeControl, "[" + value + "]")
          } else console.log("[FreeboxTV] Volume Control wrong value:", payload)
          break
        case "EXT-FREEBOXTV-VOLUME_MIN":
          if (this.FreeboxTV.playing) this.sendSocketNotification("VOLUME_CONTROL", this.config.volume.min)
          break
        case "EXT-FREEBOXTV-VOLUME_MAX":
          if (this.FreeboxTV.playing) this.sendSocketNotification("VOLUME_CONTROL", this.volumeControl ? this.volumeControl : this.config.volume.start)
          break
      }
    },

    socketNotificationReceived: function(notification, payload) {
      if (notification == "INITIALIZED") {
        this.Channels = payload
        var iterifyArr = function (arr) {
         arr.next = (function (cur) { return (++cur >= this.length) ? false : this[cur]; })
         arr.prev = (function (cur) { return (--cur < 0) ? false : this[cur]; })
         return arr
        }
        iterifyArr(this.Channels)
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
    },

    TV: function(command, handler) {
      if (handler.args) {
        if (this.ChannelsCheck(handler.args)) {
          this.playStream(handler.args)
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

    ChannelsCheck: function (channel) {
      if (this.Channels.indexOf(channel) > -1) return true
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
