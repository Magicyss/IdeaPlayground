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
 * Supports looping a specific segment of the source audio
 */
export async function mixAudioBuffers(sources, totalDuration, sampleRate = 44100, numberOfChannels = 2) {
  const audioContext = new OfflineAudioContext(
    numberOfChannels,
    Math.ceil(totalDuration * sampleRate),
    sampleRate
  );

  for (const source of sources) {
    const sourceBuffer = source.buffer;
    const sourceStart = source.sourceStart ?? 0;
    const sourceEnd = source.sourceEnd ?? sourceBuffer.duration;
    const clipDuration = sourceEnd - sourceStart;

    // Skip invalid clips
    if (clipDuration <= 0) continue;

    const outputStartTime = source.startTime ?? 0;
    const outputDuration = source.duration ?? clipDuration;
    const volume = source.volume ?? 1;

    if (source.loop && clipDuration > 0) {
      // For looping audio from a specific segment, we need to create multiple buffer sources
      let currentOffset = 0;
      while (currentOffset < outputDuration) {
        const remainingDuration = outputDuration - currentOffset;
        const segmentDuration = Math.min(clipDuration, remainingDuration);

        const bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = sourceBuffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;

        bufferSource.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Start at the output position, play from sourceStart for segmentDuration
        bufferSource.start(outputStartTime + currentOffset, sourceStart, segmentDuration);

        currentOffset += clipDuration;
      }
    } else {
      // Non-looping: just play from sourceStart
      const bufferSource = audioContext.createBufferSource();
      bufferSource.buffer = sourceBuffer;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;

      bufferSource.connect(gainNode);
      gainNode.connect(audioContext.destination);

      bufferSource.start(outputStartTime, sourceStart, Math.min(clipDuration, outputDuration));
    }
  }

  return await audioContext.startRendering();
}

export default {
  createAudioMixer,
  mixAudioBuffers,
};
