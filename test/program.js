import test from 'tape';
import detect from './../src/detect';

const AudioContext = (window.AudioContext || window.webkitAudioContext);

/**
 * Load raw wav files encoded in base64
 */

// Needed to circumvent Babel's transformation
const fs = require('fs');
let fixtures = {
  '90': fs.readFileSync(__dirname + '/fixtures/90bpm.wav', 'base64'),
  '97': fs.readFileSync(__dirname + '/fixtures/97bpm.wav', 'base64'),
  '117': fs.readFileSync(__dirname + '/fixtures/117bpm.wav', 'base64'),
  '140': fs.readFileSync(__dirname + '/fixtures/140bpm.wav', 'base64'),
  '170': fs.readFileSync(__dirname + '/fixtures/170bpm.wav', 'base64')
};

test('detects bpm', t => {
  const beats = [97, 117, 140, 170];

  Promise.all(
    beats.map(bpm => convert(fixtures[bpm]))
  ).then(buffers => {
    try {
      for (let [i, buffer] of buffers.entries()) {
        const bpm = detect(buffer);
        t.equal(beats[i], bpm, `Detected ${beats[i]} bpm`);
      }
    } catch (err) {
      t.fail(err);
    }
  }).then(t.end, t.end);
});

test('fails with short sample', t => {
  convert(fixtures['90']).then(buffer => {
    try {
      const bpm = detect(buffer);
      t.fail(`Detected ${bpm}`);
    } catch (err) {
      t.pass(err);
    }
  }).then(t.end, t.end);
});

/**
 * Convert base64 string into AudioBuffer
 */

function convert(base64) {
  const context = new AudioContext();
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i += 1)        {
    bytes[i] = binaryString.charCodeAt(i);
  }

  try {
    return context.decodeAudioData(bytes.buffer);
  } catch (err) {
    return new Promise((resolve, reject) => {
      return context.decodeAudioData(bytes.buffer, resolve, reject);
    });
  }
}
