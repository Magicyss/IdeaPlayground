/**
 * WebCodecs Video Encoder
 * Encodes VideoFrame objects to H.264
 */

import { getBestVideoCodecConfig } from '../capabilities.js';

/**
 * Create a video encoder
 * @param {Object} options - Encoder options
 * @returns {Promise<Object>} Encoder control object
 */
export async function createVideoEncoder({
  width,
  height,
  bitrate = 5_000_000,
  framerate = 30,
  onChunk,
  onError,
}) {
  let encoder = null;
  let frameCount = 0;
  let encoderConfig = null;

  encoderConfig = await getBestVideoCodecConfig(width, height, bitrate, framerate);

  const chunkHandler = (chunk, metadata) => {
    if (onChunk) {
      onChunk(chunk, metadata);
    }
  };

  const errorHandler = (error) => {
    console.error('[VideoEncoder] Error:', error);
    if (onError) {
      onError(error);
    }
  };

  encoder = new VideoEncoder({
    output: chunkHandler,
    error: errorHandler,
  });

  encoder.configure(encoderConfig);

  return {
    get config() {
      return encoderConfig;
    },

    encode(frame, options = {}) {
      const { keyFrame = false } = options;
      const forceKeyFrame = keyFrame || (frameCount % (framerate * 2) === 0);
      encoder.encode(frame, { keyFrame: forceKeyFrame });
      frameCount++;
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

    get frameCount() {
      return frameCount;
    },
  };
}

export async function isCodecSupported(codec, width, height) {
  try {
    const support = await VideoEncoder.isConfigSupported({
      codec,
      width,
      height,
      bitrate: 5_000_000,
      framerate: 30,
    });
    return support.supported;
  } catch {
    return false;
  }
}

export default {
  createVideoEncoder,
  isCodecSupported,
};
