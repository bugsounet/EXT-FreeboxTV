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
var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({

  omxStream: {},
  omxStreamTimeouts: {},

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
      log("Started")
    }
    if (notification === "PLAY_VLCSTREAM") {
      this.getVlcPlayer(payload)
    }
    if (notification === "STOP_VLCSTREAM") {
      this.stopVlcPlayer()
    }
    /** to do
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
    **/
  },

  start: function() {
    console.log("[FreeboxTV] Starts...")
  },

  stop: function() {
    log("Arrêt du flux TV... " + this.config.localPlayer)

    // Kill any running OMX Streams
    if (this.config.localPlayer === "omxplayer") {
      child_process.spawn(path.resolve(__dirname + '/scripts/onexit.js'), { stdio: 'ignore', detached: true })
    }

    // Kill any VLC Streams that are open
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
        console.log("fullscreen")
        args.pop();
        args.push(this.FreeboxTV[TV.name])
        args.unshift("--fullscreen")
      } else if (!("fullscreen" in TV)) {
        args.unshift("--width", TV.box.right - TV.box.left, "--height", TV.box.bottom - TV.box.top)
        positions[TV.name] = `${TV.box.left}, ${TV.box.top}, ${TV.box.right-TV.box.left}, ${TV.box.bottom-TV.box.top}`
      }
      log(`Démarrage de la chaine ${TV.name} (utilisation de VLC avec arguments: ${args.join(' ')}...`)

      this.vlcStream.FreeboxTV = child_process.spawn(vlcCmd, args, opts)

      this.vlcStream.FreeboxTV.on('error', (err) => {
        console.error(`Impossible de démarrer le processus: ${this.vlcStream.FreeboxTV}.`)
      })

      dp2Check = true
    }
    if (!dp2Check) { return; }
    var dp2Cmd = `devilspie2`
    var dp2Args = ['--debug', '-f', path.resolve(__dirname + '/scripts')]
    let dp2Config = ``
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
    })

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
          setTimeout(() => { startDp2(); }, 7000)
        });
      } else {
        startDp2()
        setTimeout(() => { startDp2(); }, 5000)
      }
    });
  },

  stopVlcPlayer: function() {
    if ("FreeboxTV" in this.vlcStream) {
      log("Arrêt de la diffusion")
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
