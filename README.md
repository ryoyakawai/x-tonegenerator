# x-tonegenerator
## Live Demo
[https://ryoyakawai.github.io/x-tonegenerator/](https://ryoyakawai.github.io/x-tonegenerator/)  
(MIDI device is required to run this demo.)

## What is this?
This is a Polymer Element of "PCM Tone Generator" powered by Web Audio.

## Installation
### bower
```shell
$ bower install x-tonegenerator;
```
### Sample Code
This sample code allow you to play Piano sound with clicking/tapping button in the page.
```html
<html>
  <body>
    <!-- importing x-tonegenerator, Polymer and polyfill of webcomponents -->
    <script src="bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
    <link rel="import" href="bower_components/polymer/polymer.html">
    <link rel="import" href="bower_components/x-tonegenerator/x-tonegenerator.html" >

    <!-- activating x-tonegenerator -->
    <x-tonegenerator id="tg"></x-tonegenerator>

    <button id="play">Play</button>

    <script type="text/javascript">
     var tg=document.querySelector("#tg");
     var tg=document.querySelector("#tg");
     document.querySelector("#play").addEventListener("mousedown", event => {
         tg.noteOn(["90", "50", "7f"]);
     });
     document.querySelector("#play").addEventListener("mouseup", event => {
         tg.noteOff(["80", "50", "00"]);
     });
    </script>
  </body>
</html>
```


## Special Thanks
[@g200kg](https://twitter.com/g200kg)

## License
[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

## Copyright
Copyright (c) 2016 Ryoya Kawai
