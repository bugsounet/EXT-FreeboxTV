/* Magic Mirror
 * Node Helper: MMM-FreeboxTV
 */

var NodeHelper = require("node_helper");
var Stream = require('node-rtsp-stream-es6');
const fs = require('fs');
const path = require("path");
const child_process = require('child_process');
const environ = Object.assign(process.env, { DISPLAY: ":0" });
const pm2 = require('pm2');

module.exports = NodeHelper.create({

  omxStream: {},
  omxStreamTimeouts: {},

  vlcStream: {},
  vlcStreamTimeouts: {},
  FreeboxTV: {
    "france2": {
      url: 'rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=201&flavour=sd',
      urlHD: 'rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=201&flavour=hd'
    },
    "france3": {
      url : "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=202&flavour=sd",
      urlHD: "rtsp://mafreebox.freebox.fr/fbxtv_pub/stream?namespace=1&service=202&flavour=hd"
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'CONFIG') {
      console.log("config")
      this.config = payload;
      this.sendSocketNotification("STARTED");
    }
    if (notification === "PLAY_OMXSTREAM") {
      this.getOmxplayer(payload);
    }
    if (notification === "STOP_OMXSTREAM") {
      this.stopOmxplayer(payload);
    }
    if (notification === "STOP_ALL_OMXSTREAMS") {
      if (Object.keys(this.omxStream).length > 0) {
        this.stopAllOmxplayers();
      }
    }
    if (notification === "PLAY_VLCSTREAM") {
      this.getVlcPlayer(payload);
    }
    if (notification === "STOP_VLCSTREAM") {
      this.stopVlcPlayer();
    }
  },

  start: function() {
      this.started = false;
      this.stopAllOmxplayers();
  },

  stop: function() {
    console.log("Arret des flux de MMM-FreeboxTV... " + this.config.localPlayer);

    // Kill any running OMX Streams
    if (this.config.localPlayer === "omxplayer") {
      child_process.spawn(path.resolve(__dirname + '/scripts/onexit.js'), { stdio: 'ignore', detached: true });
    }

    // Kill any VLC Streams that are open
    if (this.config.localPlayer === "vlc") {
      if (this.dp2) {
        console.log("Killing DevilsPie2...");
        this.dp2.stderr.removeAllListeners();
        this.dp2.kill();
        this.dp2 = undefined;
      }
      this.stopVlcPlayer();
    }
  },

  getVlcPlayer: function(payload) {
    var opts = { detached: false, env: environ, stdio: ['ignore', 'ignore', 'pipe'] };
    var vlcCmd = `vlc`;
    var positions = {};
    let dp2Check = false;
    s = payload[0]

    // Abort a single delayed shutdown, if there was one.
    if (s.name in this.vlcStream) {
      console.log(this.vlcStream)
      child_process.exec(`wmctrl -r FreeboxTV -b remove,hidden && wmctrl -a FreeboxTV`, { env: environ }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
      });
      return;
    } else {
      // Otherwise, Generate the VLC window
      var args = ["-I", "dummy", '--video-on-top', "--no-video-deco", "--no-embedded-video", "--video-title=FreeboxTV",
          this.FreeboxTV[s.name].url
      ];
      if ("fullscreen" in s && "url" in this.FreeboxTV[s.name]) {
        console.log("fullscreen")
        args.pop();
        args.push(this.FreeboxTV[s.name].url);
        args.unshift("--fullscreen")
      } else if (!("fullscreen" in s)) {
        args.unshift("--width", s.box.right - s.box.left, "--height", s.box.bottom - s.box.top);
        positions[s.name] = `${s.box.left}, ${s.box.top}, ${s.box.right-s.box.left}, ${s.box.bottom-s.box.top}`;
      }
      console.log(`Starting stream ${s.name} using VLC with args ${args.join(' ')}...`);

      this.vlcStream.FreeboxTV = child_process.spawn(vlcCmd, args, opts);

      this.vlcStream.FreeboxTV.on('error', (err) => {
        console.error(`Failed to start subprocess: ${this.vlcStream.FreeboxTV}.`);
      });

      dp2Check = true;
    }
    if (!dp2Check) { return; }
    var dp2Cmd = `devilspie2`;
    var dp2Args = ['--debug', '-f', path.resolve(__dirname + '/scripts')];
    let dp2Config = ``;
    Object.keys(positions).forEach(p => {
      console.log(p)
        dp2Config += `
if (get_window_name()=="FreeboxTV") then
  set_window_geometry(${positions[p]});
  undecorate_window();
  set_on_top();
  make_always_on_top();
end
`;
    });

    var startDp2 = () => {
      if (this.dp2) {
          this.dp2.stderr.removeAllListeners();
          this.dp2.kill();
          this.dp2 = undefined;
      }
      console.info("DP2: Running window resizers...");
      this.dp2 = child_process.spawn(dp2Cmd, dp2Args, opts);
      this.dp2.on('error', (err) => {
          console.error('DP2: Failed to start.');
      });
    };

    fs.readFile(path.resolve(__dirname + '/scripts/vlc.lua'), "utf8", (err, data) => {
      if (err) throw err;

      // Only write the new DevilsPie2 config if we need to.
      if (data !== dp2Config) {
        fs.writeFile(path.resolve(__dirname + '/scripts/vlc.lua'), dp2Config, (err) => {
          // throws an error, you could also catch it here
          if (err) throw err;

          console.log('DP2: Config File Saved!');
          if (this.config.debug) { console.log(dp2Config); }
          startDp2();
          // Give the windows time to settle, then re-call to resize again.
          setTimeout(() => { startDp2(); }, 7000);
        });
      } else {
        startDp2();
        setTimeout(() => { startDp2(); }, 3000);
      }
    });
  },

  stopVlcPlayer: function() {
    if ("FreeboxTV" in this.vlcStream) {
      console.log("Stopping stream");
      try {
        this.vlcStream.FreeboxTV.stderr.removeAllListeners();
        this.vlcStream.FreeboxTV.kill();
      } catch (err) {
        console.log(err);
      }
      delete this.vlcStream.FreeboxTV;
    }
  },

    getOmxplayer: function(payload) {
        if (this.pm2Connected) {
            // Busy doing something, wait a half sec.
            setTimeout(() => { this.getOmxplayer(payload); }, 500);
            return;
        }

        var opts = { detached: false, stdio: 'ignore' };

        var omxCmd = `omxplayer`;

        var namesM = [];

        var argsM = [];

        payload.forEach(s => {
            var args = ["--live", "--video_queue", "4", "--fps", "30", "--no-osd",
                this.config[s.name].url
            ];
            if (!("fullscreen" in s)) {
                args.unshift("--win", `${s.box.left},${s.box.top},${s.box.right},${s.box.bottom}`);
            } else {
                if ("hdUrl" in this.config[s.name]) {
                    args.pop();
                    args.push(this.config[s.name].hdUrl);
                }
            }
            if (this.config[s.name].protocol !== "udp") {
                args.unshift("--avdict", "rtsp_transport:tcp");
            }
            if (this.config[s.name].muted) {
                args.unshift("-n", "-1");
            }
            if ("timeout" in this.config[s.name] && this.config[s.name].timeout) {
                args.unshift("--timeout", this.config[s.name].timeout);
            }
            if ("rotateDegree" in this.config[s.name] && this.config[s.name].rotateDegree) {
                args.unshift("--orientation", this.config[s.name].rotateDegree);
                args.unshift("--aspect-mode", "stretch");
            }
            if (this.config.debug) {
                args.unshift("-I");
            }
            console.log(`Starting stream ${s.name} using: ${omxCmd} ${args.join(' ')}`);

            argsM.push(args);
            namesM.push("omx_" + s.name);
        });

        // this.omxStream[payload.name] = child_process.spawn(omxCmd, args, opts);

        // PM2 Test

        pm2.connect((err) => {
            if (err) {
                console.error(err);
                return;
            }
            this.pm2Connected = true;

            // Stops the Daemon if it's already started
            pm2.list((err, list) => {
                var errCB = (err, apps) => {
                    if (err) {
                        console.log(err);
                        pm2.disconnect();
                        this.pm2Connected = false;
                        return;
                    }
                };

                var startProcs = () => {
                    if (namesM.length > 0) {
                        console.log("Starting PM2 for " + namesM[namesM.length - 1]);
                        pm2.start({
                            script: "omxplayer",
                            name: namesM[namesM.length - 1],
                            interpreter: 'bash',
                            out_file: "/dev/null",
                            //interpreterArgs: '-u',
                            args: argsM[namesM.length - 1],
                            //max_memory_restart : '100M'   // Optional: Restarts your app if it reaches 100Mo
                        }, (err, proc) => {
                            console.log("PM2 started for " + namesM[namesM.length - 1]);
                            this.omxStream[namesM[namesM.length - 1]] = namesM[namesM.length - 1];

                            // Automatically Restart OMX PM2 Instance every X Hours
                            let restartHrs = this.config.omxRestart;
                            if (typeof restartHrs === "number") {
                                let worker = () => {
                                    pm2.restart(namesM[namesM.length - 1], function() {});
                                    this.omxStreamTimeouts[namesM[namesM.length - 1]] = setTimeout(worker, restartHrs * 60 * 60 * 1000);
                                };
                                this.omxStreamTimeouts[namesM[namesM.length - 1]] = setTimeout(worker, restartHrs * 60 * 60 * 1000);
                            }

                            namesM.pop();
                            argsM.pop();
                            startProcs();
                            if (err) { throw err; }
                        });
                    } else {
                        pm2.disconnect(); // Disconnects from PM2
                        this.pm2Connected = false;
                    }
                };

                for (var proc in list) {
                    if ("name" in list[proc] && namesM.indexOf(list[proc].name) > -1) {
                        if ("status" in list[proc].pm2_env && list[proc].pm2_env.status === "online") {
                            console.log(`PM2: ${list[proc].name} already running. Stopping old instance...`);
                            pm2.stop(list[proc].name, errCB);
                        }
                    }
                }

                startProcs();
            });

        });
    },

    stopOmxplayer: function(name, callback) {
        if (this.pm2Connected) {
            // Busy doing something, wait a half sec.
            console.info("PM2: waiting my turn...");
            setTimeout(() => { this.stopOmxplayer(name, callback); }, 500);
            return;
        }

        console.log(`Stopping stream ${name}`);

        pm2.connect((err) => {
            if (err) {
                console.error(err);
                return;
            }
            this.pm2Connected = true;

            console.log("Stopping PM2 process: omx_" + name);
            pm2.stop("omx_" + name, (err2, apps) => {
                if (!err2) {
                    clearTimeout(this.omxStreamTimeouts[name]);
                    delete this.omxStream[name];
                } else {
                    console.log(err2);
                }
                pm2.disconnect();
                this.pm2Connected = false;

                if (typeof callback === "function") { callback(); }
            });
        });

    },

    stopAllOmxplayers: function(callback) {
        if (this.pm2Connected) {
            // Busy doing something, wait a half sec.
            setTimeout(() => { this.stopAllOmxplayers(callback); }, 500);
            return;
        }

        console.log('PM2: Stopping all OMXPlayer Streams...');
        pm2.connect((err) => {
            if (err) {
                console.error(err);
                return;
            }
            this.pm2Connected = true;
            
            // Stops the Daemon if it's already started
            pm2.list((err2, list) => {
                if (err2) {
                    console.log(err2);
                    pm2.disconnect();
                    this.pm2Connected = false;
                    return;
                }

                var toStop = [];

                var stopProcs = () => {
                    if (toStop.length > 0) {
                        pm2.stop(toStop[toStop.length - 1], (e, p) => {
                            if (e) { console.log(e); throw e; }
                            toStop.pop();
                            stopProcs();
                        });
                    } else {
                        pm2.disconnect();
                        this.omxStream = {};
                        this.pm2Connected = false;
                        Object.keys(this.omxStreamTimeouts).forEach(s => {
                            clearTimeout(s);
                        });
                        if (typeof callback === "function") { callback(); }
                        return;
                    }
                };

                for (var proc in list) {
                    if ("name" in list[proc] && list[proc].name.startsWith("omx_")) {
                        console.log(`PM2: Checking if ${list[proc].name} is running...`);
                        if ("status" in list[proc].pm2_env && list[proc].pm2_env.status === "online") {
                            console.log(`PM2: Stopping ${list[proc].name}...`);
                            toStop.push(list[proc].name);
                        }
                    }
                }
                // New Way:
                // let omxProcs = list.filter(o => o.name.startsWith("omx_"));
                // if (omxProcs) {
                //     console.log(Object.keys(omxProcs));
                //     omxProcs.forEach(o => {
                //         console.log(`PM2: Checking if ${o.name} is running...`);
                //         if ("status" in o.pm2_env && o.pm2_env.status === "online") {
                //             console.log(`PM2: Stopping ${o.name}...`);
                //             toStop.push(o.name);
                //         }
                //     });
                // }
                stopProcs();
            });
        });
    },
});
