(function() {
  'use strict';

    class Piano {
        constructor(tg) {
            this.tg=tg;
            this.voices=[];
            this.chVoiceIdx=[];
            this.velocityMap=[];
            this.key={min:0, max:120};
        }
        getVelocitiesByNoteNo(noteNo) {
            return this.velocityMap[noteNo];
        }
        init() {
            this.chVoiceIdx[0]=this.tg.setVoice(0, "piano021");
            this.chVoiceIdx[1]=this.tg.setVoice(1, "piano045");
            this.chVoiceIdx[2]=this.tg.setVoice(2, "piano069");
            this.chVoiceIdx[3]=this.tg.setVoice(3, "piano093");
            this.chVoiceIdx[4]=this.tg.setVoice(4, "piano117");
            this.voices=this.tg.getVoiceConfig();
            var sampleNoteNos=[];
            for(var i=0; i<this.chVoiceIdx.length; i++) {
                sampleNoteNos.push(this.voices[this.chVoiceIdx[i]].noteno);
            }
            var nextNoteIdx=0;
            for(var i=this.key.min; i<=this.key.max; i++) {
                for(var j=0; j<sampleNoteNos.length; j++) {
                    if(i==sampleNoteNos[j]) {
                        nextNoteIdx=j+1;
                        for(var k=0; k<sampleNoteNos[nextNoteIdx]-sampleNoteNos[nextNoteIdx-1]; k++) {
                            var out=[0, 0, 0, 0, 0];
                            var delta=127/(sampleNoteNos[nextNoteIdx]-sampleNoteNos[nextNoteIdx-1]);
                            out[nextNoteIdx]=k*delta;
                            out[nextNoteIdx-1]=127-k*delta;
                            this.velocityMap[i]=out;
                            i++;
                            if(i==117) this.velocityMap[i]=[0, 0, 0, 0, 127];
                        }
                    } else if(i<sampleNoteNos[j]) {
                        this.velocityMap[i]=[127, 0, 0, 0, 0];
                    } else if(i>=sampleNoteNos[sampleNoteNos.length-1]) {
                        this.velocityMap[i]=[0, 0, 0, 0, 127];
                    }
                }
            }
        }

    }

    window.piano = new Piano(tg);

})();
