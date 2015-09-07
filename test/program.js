import 'babel/polyfill';
import 'whatwg-fetch';
import test from 'tape';
import detect from './../lib/detect';

const AudioContext = (window.AudioContext || window.webkitAudioContext);

/**
 * Load raw wav files encoded in base64
 */

// Needed to circumvent Babel's transformation
const fs = require('fs');
let fixtures = {
  '90': fs.readFileSync(__dirname + '/fixtures/90bpm.wav', { encoding: 'base64' }),
  '97': fs.readFileSync(__dirname + '/fixtures/97bpm.wav', { encoding: 'base64' }),
  '117': fs.readFileSync(__dirname + '/fixtures/117bpm.wav', { encoding: 'base64' }),
  '140': fs.readFileSync(__dirname + '/fixtures/140bpm.wav', { encoding: 'base64' }),
  '170': fs.readFileSync(__dirname + '/fixtures/170bpm.wav', { encoding: 'base64' })
};

test('detects bpm', assert => {
  const beats = [97, 117, 140, 170];

  // Load beats
  Promise.all(beats.map(bpm => convert(fixtures[bpm])))
    // Detect bpm of all beats
    .then(sources => Promise.all(sources.map(detect)))
    // Match detected bpm to expected bpm
    .then(results => results.map((bpm, index) => [bpm, beats[index]]))
    // Map pairs through assert
    .then(pairs => pairs.forEach(pair => assert.equal(...pair)))
    .then(assert.end, assert.end);
});

test('fails with short sample', assert => {
  convert(fixtures['90'])
    .then(detect)
    .then(bpm => assert.fail(`Detected ${ bpm }`))
    .catch(err => assert.pass(err.message))
    .then(assert.end);
});

/**
 * Convert base64 string into AudioBuffer
 */

function convert(base64) {
  let context = new AudioContext();
  let binaryString = atob(base64);
  let len = binaryString.length;
  let bytes = new Uint8Array(len);

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
