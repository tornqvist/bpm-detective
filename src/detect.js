const OfflineContext = (window.OfflineAudioContext || window.webkitOfflineAudioContext);

/**
 * Detect BPM of a sound source
 * @param  {AudioBuffer} buffer Sound to process
 * @return {Number}             Detected BPM
 */

export default function detect(buffer) {
  const source = getLowPassSource(buffer);

  /**
   * Schedule the sound to start playing at time:0
   */

  source.start(0);

  /**
   * Pipe the source through the program
   */

  return [
    findPeaks,
    identifyIntervals,
    groupByTempo(buffer.sampleRate),
    getTopCandidate
  ].reduce(
   (state, fn) => fn(state),
    source.buffer.getChannelData(0)
  );
}

/**
 * Sort results by count and return top candidate
 * @param  {Object} Candidate
 * @return {Number}
 */

function getTopCandidate(candidates) {
  return candidates
    .sort((a, b) => (b.count - a.count))
    .splice(0, 5)[0].tempo;
}

/**
 * Apply a low pass filter to an AudioBuffer
 * @param  {AudioBuffer}            buffer Source AudioBuffer
 * @return {AudioBufferSourceNode}
 */

function getLowPassSource(buffer) {
  const {length, numberOfChannels, sampleRate} = buffer;
  const context = new OfflineContext(numberOfChannels, length, sampleRate);

  /**
   * Create buffer source
   */

  const source = context.createBufferSource();
  source.buffer = buffer;

  /**
   * Create filter
   */

  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';

  /**
   * Pipe the song into the filter, and the filter into the offline context
   */

  source.connect(filter);
  filter.connect(context.destination);

  return source;
}

/**
 * Find peaks in sampleRate
 * @param  {Array} data Bugger channel data
 * @return {Array}      Peaks found that are greater than the threshold
 */

function findPeaks(data) {
    let peaks = [];
    let threshold = 0.9;
    const minThresold = 0.3;
    const minPeaks = 15;

    /**
     * Keep looking for peaks lowering the threshold until
     * we have at least 15 peaks (10 seconds @ 90bpm)
     */

    while (peaks.length < minPeaks && threshold >= minThresold) {
      peaks = findPeaksAtThreshold(data, threshold);
      threshold -= 0.05;
    }

    /**
     * Too fiew samples are unreliable
     */

    if (peaks.length < minPeaks) {
      throw (
        new Error('Could not find enough samples for a reliable detection.')
      );
    }

    return peaks;
}

/**
 * Function to identify peaks
 * @param  {Array}  data      Buffer channel data
 * @param  {Number} threshold Threshold for qualifying as a peak
 * @return {Array}            Peaks found that are grater than the threshold
 */

function findPeaksAtThreshold(data, threshold) {
  const peaks = [];

  /**
   * Identify peaks that pass the threshold, adding them to the collection
   */

  for (var i = 0, l = data.length; i < l; i += 1) {
    if (data[i] > threshold) {
      peaks.push(i);

      /**
       * Skip forward ~ 1/4s to get past this peak
       */

      i += 10000;
    }
  }

  return peaks;
}

/**
 * Identify intervals between peaks
 * @param  {Array} peaks Array of qualified peaks
 * @return {Array}       Identifies intervals between peaks
 */

function identifyIntervals(peaks) {
  const intervals = [];

  peaks.forEach((peak, index) => {
    for (let i = 0; i < 10; i+= 1) {
      let interval = peaks[index + i] - peak;

      /**
       * Try and find a matching interval and increase it's count
       */

      let foundInterval = intervals.some(intervalCount => {
        if (intervalCount.interval === interval) {
          return intervalCount.count += 1;
        }
      });

      /**
       * Add the interval to the collection if it's unique
       */

      if (!foundInterval) {
        intervals.push({
          interval: interval,
          count: 1
        });
      }
    }
  });

  return intervals;
}

/**
 * Factory for group reducer
 * @param  {Number} sampleRate Audio sample rate
 * @return {Function}
 */

function groupByTempo(sampleRate) {

  /**
   * Figure out best possible tempo candidates
   * @param  {Array} intervalCounts List of identified intervals
   * @return {Array}                Intervals grouped with similar values
   */

  return (intervalCounts) => {
    const tempoCounts = [];

    intervalCounts.forEach(intervalCount => {
      if (intervalCount.interval !== 0) {
        /**
         * Convert an interval to tempo
         */

        let theoreticalTempo = (60 / (intervalCount.interval / sampleRate));

        /**
         * Adjust the tempo to fit within the 90-180 BPM range
         */

        while (theoreticalTempo < 90) theoreticalTempo *= 2;
        while (theoreticalTempo > 180) theoreticalTempo /= 2;

        /**
         * Round to legible integer
         */

        theoreticalTempo = Math.round(theoreticalTempo);

        /**
         * See if another interval resolved to the same tempo
         */

        let foundTempo = tempoCounts.some(tempoCount => {
          if (tempoCount.tempo === theoreticalTempo) {
            return tempoCount.count += intervalCount.count;
          }
        });

        /**
         * Add a unique tempo to the collection
         */

        if (!foundTempo) {
          tempoCounts.push({
            tempo: theoreticalTempo,
            count: intervalCount.count
          });
        }
      }
    });

    return tempoCounts;
  }
}
