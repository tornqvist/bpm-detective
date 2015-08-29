import test from 'tape';
import detect from './../lib/detect';

const AudioContext = (window.AudioContext || window.webkitAudioContext);

test('detects bpm', assert => {
  const beats = [97, 117, 140, 170];

  assert.plan(beats.length);

  // Load beats
  Promise.all(beats.map(loadBeat))
    // Detect bpm of all beats
    .then((sources) => Promise.all(sources.map(detect)))
    .catch(assert.end)
    // Match detected bpm to expected bpm
    .then(results => results.map((bpm, index) => [bpm, beats[index]]))
    // Map pairs through assert
    .then(pairs => pairs.forEach(pair => assert.equal(...pair)));
});

test('fails with short sample', assert => {
  loadBeat(90)
    .then(detect)
    .then(bpm => assert.fail(`Detected ${ bpm }`))
    .catch(err => assert.pass(err.message))
    .then(assert.end);
});

function loadBeat(bpm) {
  let url = `fixtures/${ bpm }bpm.wav`;
  let context = new AudioContext();

  return new Promise((resolve, reject) => {
    return fetch(url)
      .then(response => response.arrayBuffer())
      .then(buffer => context.decodeAudioData(buffer, resolve, reject))
      .catch(reject);
  });
}
