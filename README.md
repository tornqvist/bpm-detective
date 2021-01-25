# bpm-detective

> Detects the BPM of a song or audio sample

This module uses the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) to try and detect the BPM of a given sound. You can find more on the implementation and how it works by reading the blog post [Beat Detection Using JavaScript and the Web Audio API](http://joesul.li/van/beat-detection-using-web-audio/) which happens to be where I got most of the code.

## Install

```bash
$ npm install --save bpm-detective
```

## Usage

The module exports one function. The function takes an [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) as its only argument. It *returns the detected BPM*. If the sample was too short or if, for any other reason, the detection failed, the method *throws an error*.

```javascript
import detect from 'bpm-detective'

const AudioContext = window.AudioContext || window.webkitAudioContext
const context = new AudioContext()

// Fetch some audio file
fetch('some/audio/file.wav').then(async function (response) {
  // Get response as ArrayBuffer
  const buffer = await response.arrayBuffer()

  // Decode audio into an AudioBuffer
  const data = await new Promise(function (resolve, reject) {
    context.decodeAudioData(buffer, resolve, reject)
  });

  // Run detection
  const bpm = detect(data)
  alert(`Detected BPM: ${bpm}`)
}).catch(console.error)
```

### Disclaimer

The detection presumes you are working with dance(-ish) kind of music and as so looks only in the 90-180 BPM spectrum.

## License
MIT
