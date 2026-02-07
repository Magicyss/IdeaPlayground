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
  let isRecreating = false;

  encoderConfig = await getBestVideoCodecConfig(width, height, bitrate, framerate);

  const chunkHandler = (chunk, metadata) => {
    if (onChunk) {
      onChunk(chunk, metadata);
    }
  };

  const errorHandler = (error) => {
    console.error('[VideoEncoder] Error:', error);
    // Don't propagate QuotaExceededError - we'll handle it by recreating
    if (error.name === 'QuotaExceededError') {
      console.warn('[VideoEncoder] Codec reclaimed, will recreate on next encode');
      return;
    }
    if (onError) {
      onError(error);
    }
  };

  const createEncoder = () => {
    encoder = new VideoEncoder({
      output: chunkHandler,
      error: errorHandler,
    });
    encoder.configure(encoderConfig);
    console.log('[VideoEncoder] Created/recreated encoder');
  };

  // Initial creation
  createEncoder();

  const ensureEncoder = () => {
    // If encoder was reclaimed or closed, recreate it
    if (encoder.state !== 'configured') {
      if (isRecreating) return;
      isRecreating = true;
      try {
        if (encoder.state !== 'closed') {
          try {
            encoder.close();
          } catch (e) {
            // Ignore close errors
          }
        }
        createEncoder();
      } finally {
        isRecreating = false;
      }
    }
  };

  return {
    get config() {
      return encoderConfig;
    },

    encode(frame, options = {}) {
      ensureEncoder();
      const { keyFrame = false } = options;
      // Force keyframe on first frame after recreation or every 2 seconds
      const forceKeyFrame = keyFrame || (frameCount % (framerate * 2) === 0);
      try {
        encoder.encode(frame, { keyFrame: forceKeyFrame });
        frameCount++;
      } catch (error) {
        if (error.name === 'InvalidStateError') {
          // Encoder was reclaimed between check and encode, recreate and retry
          console.warn('[VideoEncoder] Encoder reclaimed during encode, recreating...');
          ensureEncoder();
          encoder.encode(frame, { keyFrame: true }); // Force keyframe after recreation
          frameCount++;
        } else {
          throw error;
        }
      }
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
