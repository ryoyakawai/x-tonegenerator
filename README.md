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
    <script src="bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
    <link rel="import" href="bower_components/polymer/polymer.html">
    <link rel="import" href="bower_components/x-tonegenerator/x-tonegenerator.html" >

    <x-tonegenerator id="tg"></x-tonegenerator>

    <button id="noteOn">noteOn</button>

    <script type="text/javascript">
     var tg=document.querySelector("#tg");
     document.querySelector("#noteOn").addEventListener("mousedown", event => {
         tg.noteOn( ["90", "50", "7f"] );
         setTimeout(() => { tg.noteOff(["80", "50", "7f"]); }, 300)
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
