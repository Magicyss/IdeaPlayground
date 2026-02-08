/**
 * Audio Encoder
 * Encodes audio data to AAC using WebCodecs
 */

import { getBestAudioCodecConfig } from '../capabilities.js';

/**
 * Create an audio encoder
 * @param {Object} options - Encoder options
 * @returns {Promise<Object|null>} Audio encoder or null if not supported
 */
export async function createAudioEncoder({
  sampleRate = 44100,
  numberOfChannels = 2,
  bitrate = 128000,
  onChunk,
  onError,
}) {
  if (typeof AudioEncoder === 'undefined') {
    return null;
  }

  const config = await getBestAudioCodecConfig(sampleRate, numberOfChannels, bitrate);
  if (!config) {
    return null;
  }

  let encoder = null;
  let sampleCount = 0;

  const chunkHandler = (chunk, metadata) => {
    if (onChunk) {
      onChunk(chunk, metadata);
    }
  };

  const errorHandler = (error) => {
    console.error('[AudioEncoder] Error:', error);
    if (onError) {
      onError(error);
    }
  };

  encoder = new AudioEncoder({
    output: chunkHandler,
    error: errorHandler,
  });

  encoder.configure(config);

  return {
    get config() {
      return config;
    },

    encode(audioData) {
      encoder.encode(audioData);
      sampleCount += audioData.numberOfFrames;
    },

    async flush() {
      if (encoder.state === 'configured') {
        await encoder.flush();
      }
    },

    close() {
      if (encoder.state !== 'closed') {
        encoder.close();
      }
    },

    get state() {
      return encoder.state;
    },

    get sampleCount() {
      return sampleCount;
    },
  };
}

/**
 * Check if audio encoding is supported
 * @returns {boolean}
 */
export function isAudioEncodingSupported() {
  return typeof AudioEncoder !== 'undefined';
}

export default {
  createAudioEncoder,
  isAudioEncodingSupported,
};
