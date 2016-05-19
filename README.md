# bpm-detective

> Detects the BPM of a song or audio sample

This module uses the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) to try and detect the BPM of a given sound. You can find more on the implementation and how it works by reading the blog post [Beat Detection Using JavaScript and the Web Audio API](http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/) which happens to be where I got most of the code.

## Install

```bash
$ npm install --save bpm-detective
```

## Usage

The module exports one function. The function takes an [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) as its only argument. It *returns the detected BPM*. If the sample was too short or if, for any other reason, the detection failed, the method *throws an error*.

```javascript
import detect from 'bpm-detective';

let context = new AudioContext();

// Fetch some audio file
fetch('some/audio/file.wav')
  // Get response as ArrayBuffer
  .then(response => response.arrayBuffer())
  // Decode audio into an AudioBuffer
  .then(data => context.decodeAudioData(data))
  // Run detection
  .then(buffer => {
    try {
      const bpm = detect(buffer);
      alert(`Detected BPM: ${ bpm }`);
    } catch (err) {
      console.error(err);
    }
  );
```

### Disclaimer

The detection presumes you are working with dance(-ish) kind of music and as so looks only in the 90-180 BPM spectrum.

## License
MIT
