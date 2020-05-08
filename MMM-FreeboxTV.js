/* MMM-FreeboxTV */

var global = this;

Module.register("MMM-FreeboxTV", {
    defaults: {
      debug: false,
      autoStart: false,
      localPlayer: "vlc", // "omxplayer" or "ffmpeg", or "vlc"
      moduleWidth: 384, // Width = (Stream Width + 30px margin + 2px border) * # of Streams Wide
      moduleHeight: 272, // Height = (Stream Height + 30px margin + 2px border) * # of Streams Tall
      moduleOffset: 0, // Offset to align OMX player windows
      shutdownDelay: 11, // Seconds
      TV: {
        protocol: "tcp", // 'tcp' or 'udp'
        width: 320,
        height: 240,
        omxRestart: 24, // Hours
      },
    },

    playing: false,

    currentIndex: -1,

    currentStream: '',

    streams: {},

    start: function() {
      var self = this;

      this.loaded = false;
      this.sendSocketNotification('CONFIG', this.config);
      this.streams.TV = { playing: false };
    },

    /* suspend()
     * This method is called when a module is hidden.
     */
    suspend: function() {
      console.log(`${this.name} is suspended...`);
      this.suspended = true;
      this.stopStream();
      if (this.selectedStream) { this.selectStream(undefined, true); }
    },


    resumed: function(callback) {
      console.log(`${this.name} has resumed... autoStart: ${this.config.autoStart}`);
      this.suspended = false;
      if (this.loaded) {
        if (this.config.autoStart) {
          this.playAll();
        }
      }
      if (typeof callback === "function") { callback(); }
    },

    // Overwrite the module show method to force a callback.
    show: function(speed, callback, options) {
      if (typeof callback === "object") {
        options = callback;
        callback = function() {};
      }

      newCallback = () => { this.resumed(callback); };
      options = options || {};

      MM.showModule(this, speed, newCallback, options);
    },

    playBtnCallback: function() {
      var ps = [];
      if (this.streams.TV.playing) {
        this.stopStream();
      } else {
        ps = this.playStream();
        if (this.config.localPlayer === "omxplayer") {
          this.sendSocketNotification("PLAY_OMXSTREAM", ps);
        } else if (this.config.localPlayer === "vlc") {
          this.sendSocketNotification("PLAY_VLCSTREAM", ps);
        }
      }
    },

    playBtnDblClickCB: function() {
      if (!this.streams.TV.playing) {
        var ps = this.playStream(true);
        if (this.config.localPlayer === "omxplayer") {
          this.sendSocketNotification("PLAY_OMXSTREAM", ps);
        } else if (this.config.localPlayer === "vlc") {
          this.sendSocketNotification("PLAY_VLCSTREAM", ps);
        }
      } else {
        this.playBtnCallback("TV");
      }
    },

    getDom: function() {
      var self = this;
      var wrapper = document.createElement("div");

      if (!this.loaded) {
        wrapper.innerHTML = "Loading " + this.name + "...";
        wrapper.className = "dimmed light small";
        return wrapper;
      }
      if (this.error) {
        wrapper.innerHTML = "Error loading data...";
        return wrapper;
      }

      if (this.loaded) {
        wrapper.style.cssText = `width: ${this.config.moduleWidth}px; height:${this.config.moduleHeight}px`;
        wrapper.className = "MMM-FreeboxTV wrapper";
        iw = this.getInnerWrapper();
        iw.appendChild(this.getCanvas());
        iw.appendChild(this.getPlayPauseBtn());
        wrapper.appendChild(iw);
        wrapper.appendChild(document.createElement("br"));
      }
      return wrapper;
    },

    getCanvasSize: function(streamConfig) {
      var s = '';
      if (typeof streamConfig.width !== "undefined") { s += "width: " + streamConfig.width + "px; "; }
      if (typeof streamConfig.height !== "undefined") { s += "height: " + streamConfig.height + "px; line-height: " + streamConfig.height + ";"; }
      return s;
    },

    getCanvas: function() {
      var canvas = document.createElement("canvas");
      canvas.id = "canvas_TV";
      canvas.className = "MMM-FreeboxTV canvas";
      return canvas;
    },

    getInnerWrapper: function() {
      var innerWrapper = document.createElement("div");
      innerWrapper.className = "MMM-FreeboxTV innerWrapper";
      innerWrapper.style.cssText = this.getCanvasSize(this.config.TV);
      innerWrapper.id = "iw_TV"
      return innerWrapper;
    },

    getPlayPauseBtn: function(force_visible = false) {
      var self = this;

      function makeOnClickHandler() {
        return function() {
          self.playBtnCallback();
        };
      }

      function makeOnDblClickHandler() {
        return function() {
          self.playBtnDblClickCB();
        };
      }

      var playBtnWrapper = document.createElement("div");
      playBtnWrapper.className = "control";
      playBtnWrapper.onclick = makeOnClickHandler();
      playBtnWrapper.oncontextmenu = makeOnDblClickHandler();
      playBtnWrapper.id = "playBtnWrapper_TV"

      var playBtnLabel = document.createElement("label");
      playBtnLabel.id = "playBtnLabel_TV";
      playBtnLabel.innerHTML = '<i class="fa fa-play-circle"></i>';
      playBtnWrapper.appendChild(playBtnLabel);
      return playBtnWrapper;
    },

    updatePlayPauseBtn(force_visible = false) {
      var buttonId = "playBtnLabel_TV"
      var button = document.getElementById(buttonId);
      if (!button) {
        // If not ready yet, retry in 1 second.
        setTimeout(() => this.updatePlayPauseBtn(force_visible), 1000);
        return;
      }
      if (this.streams.TV.playing) {
        button.innerHTML = '<i class="fa fa-pause-circle"></i>';
      } else {
        button.innerHTML = '<i class="fa fa-play-circle"></i>';
      }

      if (force_visible) {
        button.style.cssText = "opacity: 0.6;";
        button.parentElement.style.cssText = "opacity: 1;";
      } else {
        button.style.cssText = '';
        button.parentElement.style.cssText = '';
      }
    },

    playStream: function(channel,fullscreen = false) {
      var canvasId = "canvas_TV";
      var canvas = document.getElementById(canvasId);
      var omxPayload = [];

      console.log(channel)

     if (this.streams.TV.playing) {
        this.stopStream();
      }

      if (["omxplayer", "vlc"].indexOf(this.config.localPlayer) !== -1) {
        var rect = canvas.getBoundingClientRect();
        var offset = {};
        var payload = { name: channel };
        if (typeof this.config.moduleOffset === "object") {
          offset.left = ("left" in this.config.moduleOffset) ? this.config.moduleOffset.left : 0;
          offset.top = ("top" in this.config.moduleOffset) ? this.config.moduleOffset.top : 0;
        } else {
          offset.left = this.config.moduleOffset;
          offset.top = this.config.moduleOffset;
        }
        var box = {};
        if (fullscreen) {
          payload.fullscreen = true;
        } else {
          box = {
            top: Math.round(rect.top + offset.top), // Compensate for Margins
            right: Math.round(rect.right + offset.left), // Compensate for Margins
            bottom: Math.round(rect.bottom + offset.top), // Compensate for Margins
            left: Math.round(rect.left + offset.left) // Compensate for Margins
          };
        }
        payload.box = box;
        omxPayload.push(payload);
      }

      this.streams.TV.playing = true;
      this.playing = true;
      this.updatePlayPauseBtn();
      return omxPayload;
    },

    playAll: function() {
      var ps = [];
      var res = this.playStream();
      ps = ps.concat(res);

      if (this.config.localPlayer === "omxplayer") {
        this.sendSocketNotification("PLAY_OMXSTREAM", ps);
      } else if (this.config.localPlayer === "vlc") {
        this.sendSocketNotification("PLAY_VLCSTREAM", ps);
      }
    },

    stopStream: function() {
      if (this.streams.TV.playing) {
        if (this.config.localPlayer === "omxplayer") {
          this.sendSocketNotification("STOP_OMXSTREAM", "TV");
        } else if (this.config.localPlayer === "vlc") {
          this.sendSocketNotification("STOP_VLCSTREAM");
        } else if ("player" in this.streams.TV) {
          this.streams.TV.player.destroy();
          delete this.streams.TV.player;
        }
        this.streams.TV.playing = false;
      }
      this.playing = false;
    },

    getScripts: function() {
      return [this.file('scripts/jsmpeg.min.js')];
    },

    getStyles: function() {
      return [`${this.name}.css`, 'font-awesome.css'];
    },

    notificationReceived: function(notification, payload, sender) {
      var ps = [];

      if (notification === 'TV-PLAY') {
        ps = this.playStream(payload);
      }
      if (notification === 'TV-PLAY-FULLSCREEN') {
        ps = this.playStream(payload,true);
      }

      if (notification === 'TV-STOP') {
        this.stopStream();
      }

      if (ps.length > 0) {
        console.log(ps)
        if (this.config.localPlayer === "omxplayer") {
          this.sendSocketNotification("PLAY_OMXSTREAM", ps);
        } else if (this.config.localPlayer === "vlc") {
          this.sendSocketNotification("PLAY_VLCSTREAM", ps);
        }
      }
    },
    
    socketNotificationReceived: function(notification, payload) {
      if (notification === "STARTED") {
        if (!this.loaded) {
          this.loaded = true;
          this.updateDom(1000);
          if (!this.suspended) {
            setTimeout(() => this.resumed(), 1500);
          }
        }
      }
    },
});
