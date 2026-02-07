/**
 * Audio Mixer
 * Mixes multiple audio sources
 */

/**
 * Create an audio mixer for combining audio sources
 * @param {Object} options - Mixer options
 * @returns {Object} Audio mixer object
 */
export function createAudioMixer({ sampleRate = 44100, numberOfChannels = 2 }) {
  const tracks = [];

  return {
    addTrack({ buffer, startTime = 0, volume = 1, loop = false, duration = null }) {
      tracks.push({
        buffer,
        startTime,
        volume,
        loop,
        duration: duration || (buffer.duration * (loop ? Infinity : 1)),
      });
    },

    addSoundEffect(buffer, time, volume = 1) {
      tracks.push({
        buffer,
        startTime: time,
        volume,
        loop: false,
        duration: buffer.duration,
      });
    },

    mix(startTime, duration) {
      const numSamples = Math.ceil(duration * sampleRate);
      const output = [];

      for (let ch = 0; ch < numberOfChannels; ch++) {
        output.push(new Float32Array(numSamples));
      }

      const endTime = startTime + duration;

      for (const track of tracks) {
        const trackEndTime = track.startTime + track.duration;
        if (track.startTime >= endTime || trackEndTime <= startTime) {
          continue;
        }

        const trackBuffer = track.buffer;
        const trackSampleRate = trackBuffer.sampleRate;

        for (let ch = 0; ch < numberOfChannels; ch++) {
          const trackChannel = ch < trackBuffer.numberOfChannels ? ch : 0;
          const trackData = trackBuffer.getChannelData(trackChannel);

          for (let i = 0; i < numSamples; i++) {
            const outputTime = startTime + (i / sampleRate);

            if (outputTime < track.startTime || outputTime >= trackEndTime) {
              continue;
            }

            let trackPosition = outputTime - track.startTime;

            if (track.loop) {
              trackPosition = trackPosition % trackBuffer.duration;
            }

            const trackSampleIndex = Math.floor(trackPosition * trackSampleRate);

            if (trackSampleIndex >= 0 && trackSampleIndex < trackData.length) {
              output[ch][i] += trackData[trackSampleIndex] * track.volume;
            }
          }
        }
      }

      for (let ch = 0; ch < numberOfChannels; ch++) {
        for (let i = 0; i < numSamples; i++) {
          output[ch][i] = Math.max(-1, Math.min(1, output[ch][i]));
        }
      }

      return output;
    },

    clear() {
      tracks.length = 0;
    },

    get totalDuration() {
      if (tracks.length === 0) return 0;
      return Math.max(...tracks.map(t => t.startTime + t.duration));
    },

    get trackCount() {
      return tracks.length;
    },
  };
}

/**
 * Mix AudioBuffers to a single AudioBuffer
 */
export async function mixAudioBuffers(sources, totalDuration, sampleRate = 44100, numberOfChannels = 2) {
  const audioContext = new OfflineAudioContext(
    numberOfChannels,
    Math.ceil(totalDuration * sampleRate),
    sampleRate
  );

  for (const source of sources) {
    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = source.buffer;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = source.volume ?? 1;

    bufferSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    bufferSource.start(source.startTime ?? 0);

    if (source.loop) {
      bufferSource.loop = true;
      if (source.duration) {
        bufferSource.stop(source.startTime + source.duration);
      }
    }
  }

  return await audioContext.startRendering();
}

export default {
  createAudioMixer,
  mixAudioBuffers,
};
