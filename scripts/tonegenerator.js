/*
  Copyright (c) 2016 Ryoya Kawai.  All rights reserved.
  Special thanks to g200kg

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/
var ToneGenerator=function(actx) {
    this.audioconfig={
        ctx: actx,
        masterVolume: 1.0,
        sampleRate: 44100,
        outbufSize: 1024,
        outbuf: null,
        channelCount: 16,
        poly: {count: 16, max:32},
        voiceLoadedCount: 0
    };
    this.voices =[
        { name: "piano_g",      file: "piano_garageband",   wav: null, mode: "N", len: 0, st: 0, lp: 0, a: 0, r: 0, pr: 1, gr: 0 },
        { name: "piano2",       file: "piano2",   wav: null, mode: "N", len: 0, st: 0, lp: 0, a: 0, r: 0, pr: 1, gr: 0 },
        { name: "Applaus",      file: "applause", wav: null, mode: "L", len: 0, st: 0, lp: 0, a: 0, r: 0, pr: 1, gr: 0 },
        { name: "piano",        file: "piano",    wav: null, mode: "N", len: 0, st: 0, lp: 0, a: 0, r: 0, pr: 1, gr: 0 },
        { name: "Opn High Hat", file: "ohh",      wav: null, mode: "N", len: 0, st: 0, lp: 0, a: 0, r: 0, pr: 1, gr: 1 },
        { name: "Cabasa ",      file: "maracas",  wav: null, mode: "O", len: 0, st: 0, lp: 0, a: 0, r: 0, pr: 4, gr: 0 }
    ];
    this.que=null;
    this.oscs=null;
    this.audio=null;
    this.channels=null;
};
ToneGenerator.prototype={
    init: function() {
        this.que=this._initMessageQue();
        this.audio=this._initAudio();
        this.oscs=this._initOscs(this.audioconfig.poly.max);
        this.channels=this._initChannels(this.audioconfig.channelCount);
        this.LoadAllSamples();
        var self=this;
        var intervalId=setInterval(function(){
            if(self.audioconfig.voiceLoadedCount==self.voices.length) {
                clearInterval(intervalId);
                self._fireHTMLEvent("tg-ready");
                self.audio.Start();
            }
        });
    },
    _fireHTMLEvent: function(name) {
        var event=document.createEvent("HTMLEvents");
        event.initEvent(name, true, false);
        document.dispatchEvent(event);
    },
    startTg: function() {
        this.audio.start();
    },
    stopTG: function() {
        this.audio.stop();
    },
    _initMessageQue: function() {
        var self=this;
        function queObj() {
            this.que=[];
            this.Push=function(message) {
                this.que.push({time:window.performance.now, msg:message});
            };
            this.SetTime=function(time) {
                for(;;) {
                    if(this.que.length==0) return;
                    var d=this.que[0];
                    if(d.time > time) return;
                    this.que.shift();
                    var m0=parseInt(d.msg[1], 16);
                    var ch=(m0 & 0xf);
                    switch (m0 & 0xf0) {
                      case 0x80:
                        self.audio.NoteOff(ch, parseInt(d.msg[2], 16));
                        break;
                      case 0x90:
                        var velocity = parseInt(d.msg[3], 16);
                        if (velocity > 0)
                            self.audio.NoteOn(ch, parseInt(d.msg[2], 16), velocity);
                        else
                            self.audio.NoteOff(ch, parseInt(d.msg[2], 16));
                        break;
                      case 0xb0:
                        switch (parseInt(d.msg[2], 16)) {
                          case 7:
                            self.channels[ch].Volume(parseInt(d.msg[3], 16));
                            break;
                          case 10:
                            self.channels[ch].updatePan(parseInt(d.msg[3], 16));
                            break;
                          case 0x78:
                            self.channels[ch].allSoundOff();
                            break;
                          case 0x79:
                            self.channels[ch].resetAllControl();
                            break;
                        }
                        break;
                      case 0xc0:
                        self.channels[ch].updateVoiceNo(parseInt(d.msg[2], 16));
                        break;
                      case 0xe0:
                        self.channels[ch].updateBend(parseInt(d.msg[2], 16) + (parseInt(d.msg[3], 16) << 7) - 8192);
                        break;
                    }                                                                          
                }
            };
        };
        return new queObj;
    },
    _initChannels: function(chCount) {
        var chObj=new Array(chCount);
        var numosc=this.audioconfig.poly.count;
        var self=this; 
        for(var i=0; i<chCount; i++) {
            chObj[i]=new Channel();
            function Channel() {
                this.voiceNo=0;
                this.gain=1.0;
                this.volume=0.8;
                this.bend=0;
                this.pan=0.5; // L:0, C:0.5, R:1.0
                this.updateVoiceNo=function(value) {
                    this.voiceNo=value;
                };
                this.updateVolume=function(value) {
                    this.volume=value/127;
                };
                this.updateGain=function(value) {
                    this.gain=value/127;
                };
                this.updatePan=function(value) { // value: 0-127
                    console.info("[Pan is not acticated.]");
                    this.pan=value/127;
                };
                this.updateBend=function(value) { // value: 0-127
                    this.bend=value / 8192;
                };
                this.allSoundOff=function() {
                    for(var i=0; i<numosc; i++) {
                        self.oscs[i].Set(ch, -1, 0);
                    }
                };
                this.resetAllControl=function() {
                    for(var i=0; i<self.audioconfig.channelCount; i++) {
                        this.updateVolume(100);
                        this.updatePan(64);
                        this.updateBend(0);
                    }
                };
            }
        }
        return chObj;
        
    },
    _initAudio: function() {
        var self=this;
        function Audio() {
            this.kCount=0;
            this.start=0;
            this.spNode=null;
            var now=window.performance.now();
            var numosc=self.audioconfig.poly.count;
            this.timeLast=now;
            var rsampleRate=1/self.audioconfig.sampleRate;
            var outbufSize=self.audioconfig.outbufSize;
            self.audioconfig.outbuf=new Float32Array(outbufSize * 2);
            var outbuf=self.audioconfig.outbuf;
            for(var i=0; i < outbufSize * 2; i++) outbuf[i]=0;
            this.spNode=self.audioconfig.ctx.createScriptProcessor(outbufSize, 2, 2);
            var self2=this;
            this.spNode.onaudioprocess = function(event) {
                var outL=event.outputBuffer.getChannelData(0);
                var outR=event.outputBuffer.getChannelData(1);
                self2.MakeWave();
                outL.set(outbuf.subarray(outbufSize));
                outR.set(outbuf.subarray(outbufSize));
            };
            this.Start=function() {
                this.start=1;
                self.audio.spNode.connect(self.audioconfig.ctx.destination);
            };
            this.Stop=function(){
                this.start=0;
                self.audio.spNode.disconnect(0);
            };
            this.MakeWave=function() {
                var timeNow=window.performance.now();
                var outbuf=self.audioconfig.outbuf;
                var outbufSize=self.audioconfig.outbufSize;
                for(var i=0; i<outbufSize; i++) {
                    if((this.kCount += rsampleRate) >= 0.005) {
                        self.que.SetTime(this.timeLast+(timeNow-this.timeLast)*i/outbufSize);
                        this.kCount -= 0.005;
                        for(var j=0; j<numosc; j++) self.oscs[j].IntProcess();
                    }
                    outbuf[i]=outbuf[i + outbufSize]=0;
                    for(var j=0; j<numosc; j++) {
                        self.oscs[j].Process(i, i+outbufSize);
                    }
                }
                this.timeLast=timeNow;
            };
            this.NoteOn=function(ch, note, velocity) {
                if(note >= 0 && note < 128) {
                    var gr=0;
                    var i;
                    if(ch == 9) gr=this.voices[128+note].gr;
                    if(gr > 0) {
                        for(i=0; i<numosc; i++) {
                            if (this.oscs[osc].gr == gr) {
                                self.oscs[i].Set(ch. note, velocity);
                                return;
                            }
                        }
                    }
                    for(i=0; i<numosc; i++) {
                        if(self.oscs[i].ch==ch && self.oscs[i].note==note) {
                            self.oscs[i].Set(ch, note, velocity);
                            return;
                        }
                    }
                    
                    if(i==numosc) {
                        for(i=0; i<numosc; i++) {
                            if(self.oscs[i].enable==0) {
                                self.oscs[i].Set(ch, note, velocity);
                                return;
                            }
                        }
                    }
                }
            };
            this.NoteOff=function(ch, note) {
                if (note >= 0 && note < 128) {
                    for(var i=0; i<numosc; i++) {
                        if(self.oscs[i].ch==ch && self.oscs[i].note==note) {
                            self.oscs[i].Set(ch, -1, 0);
                        }
                    }
                }
            };

        };
        return new Audio();
    },
    _initOscs: function(oscsCount) {
        var self=this;
        function Osc() {
            this.ch=0;
            this.note=-1;
            this.delta=0;
            this.phase=0x7fffffff;
            this.velocity=0;
            this.enable=0;
            this.curveLv = this.lv = this.trig=0;
            this.volumeL = this.volumeR = 0.5;
            this.gr=0;
            this.voice=null;
            this.Set=function(ch, note, velocity) {
                this.ch=ch;
                this.note=note;
                if(this.note >= 0) {
                    this.enable=1;
                    this.velocity=velocity/128;
                    this.delta=0;
                    // if(ch==0) // ommit
                    this.voice=self.voices[self.channels[this.ch].voiceNo];
                    this.gr=this.voice.gr;
                    this.delta=(44100 * Math.pow(2, (this.note - 69) / 12)) / self.audioconfig.sampleRate * this.voice.pr;
                    this.phase=this.voice.st;
                    this.trig=1;
                } else {
                    if(this.voice.mode!="O") this.trig=0;
                }
            };
            this.IntProcess=function() {
                if(this.trig) {
                    if(this.lv>0.99) {
                        this.lv=1;
                    } else {
                        this.lv +=(1-this.lv) * (1 - this.voice.a); // attack
                    }
                    
                } else {
                    if(this.lv < 0.01) {
                        this.lv=0;
                    } else {
                        this.lv -= this.lv * (1 - this.voice.r); // release
                    }
                }
                this.volumeL=self.channels[this.ch].volume * Math.min(1, (1 - self.channels[this.ch].pan) * 2) * self.audioconfig.masterVolume;
                this.volumeR=self.channels[this.ch].volume * Math.min(1, (self.channels[this.ch].pan) * 2) * self.audioconfig.masterVolume;
            };
            this.Process=function(itrL, itrR) {
                if(this.curveLv > this.lv) {
                    if((this.curveLv -= 0.01)<0.01) this.curveLv=0;
                } else if(this.curveLv < this.lv) {
                    this.curveLv+=0.01;
                }
                if(this.curveLv == 0) {
                    this.enable=0;
                } else {
                    this.enable=1;
                }
                if(this.enable > 0) {
                    var wave=this.voice.wav;
                    if(wave) {
                        this.phase += this.delta; 
                        if(this.phase >= this.voice.len) {
                            switch(this.voice.mode) {
                              case "L":
                                this.phase -= (this.voice.len - this.voice.lp); 
                                break;
                              case "O":
                              case "N":
                                this.phase -= this.delta;
                                this.lv=0;
                                break;
                            }
                        }
                        var value = wave[Math.floor(this.phase)] * this.curveLv;
                        var outbuf=self.audioconfig.outbuf;
                        outbuf[itrL] += value * this.velocity * this.volumeL;
                        outbuf[itrR] += value * this.velocity * this.volumeR;
                    }
                }
            };
        }
        var oscsObj=[];
        for(var i=0; i<oscsCount; i++) {
            oscsObj.push(new Osc());
        }
        return oscsObj;
    },
    LoadAllSamples: function() {
        function callback(voice_file, wav, len) {
            this.audioconfig.voiceLoadedCount++;
            for (var i = 0; i < this.voices.length; i++) {
                if (this.voices[i].file == voice_file) {
                    this.voices[i].wav = wav;
                    if (this.voices[i].len == 0)
                        this.voices[i].len = len;
                }
            }
            console.info("[Voice Loaded: " + parseInt(100*(this.audioconfig.voiceLoadedCount/this.voices.length)) + "%]");
        }
        for(var i=0; i<this.voices.length; i++) {
            this._LoadSample(this.voices[i], callback.bind(this));
        }
    },
    _LoadSample: function (voice, callback) {
        var url="./voices/"+voice.file + ".wav";
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "arraybuffer";
        req.onload = function(event) {
					  var res=req.response;
					  var res8=new Uint8Array(res);
            var b=1;
					  if(res8[0x22]==0x10) {
						    b=2;
            }
					  var len=(res8.length-0x2c)>>(b-1);
					  var wav=new Float32Array(len);
            var v;
					  for(var i=0x2c,j=0; j<len; i+=b,j++) {
						    if(b==2) {
							      v=((res8[i+1]&0xff)<<8)+(res8[i]&0xff);
							      if(v&0x8000) v=v-65536;
							      v=v/65536;
						    }
						    else {
							      v=((res8[i]&0xff)-128)/256;
						    }
						    wav[j]=v;
					  }
            callback(voice.file, wav, len);
        };
        req.send();

        function _setWav(name, wav, len) {
            console.log(name, wav, len);
        }

    }
};
