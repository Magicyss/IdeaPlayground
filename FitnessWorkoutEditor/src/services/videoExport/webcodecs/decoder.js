/**
 * WebCodecs Video Decoder
 * Decodes video files to VideoFrame objects
 */

/**
 * Create a video decoder for extracting frames
 * @param {Object} options - Decoder options
 * @param {Function} options.onFrame - Callback when a frame is decoded
 * @param {Function} options.onError - Error callback
 * @returns {Object} Decoder control object
 */
export function createVideoDecoder({ onFrame, onError }) {
  let decoder = null;
  let pendingFrames = [];
  let isConfigured = false;

  const frameHandler = (frame) => {
    if (onFrame) {
      onFrame(frame);
    } else {
      pendingFrames.push(frame);
    }
  };

  const errorHandler = (error) => {
    console.error('[VideoDecoder] Error:', error);
    if (onError) {
      onError(error);
    }
  };

  decoder = new VideoDecoder({
    output: frameHandler,
    error: errorHandler,
  });

  return {
    configure(config) {
      decoder.configure(config);
      isConfigured = true;
    },

    decode(chunk) {
      if (!isConfigured) {
        throw new Error('Decoder not configured');
      }
      decoder.decode(chunk);
    },

    async flush() {
      if (decoder.state === 'configured') {
        await decoder.flush();
      }
    },

    close() {
      if (decoder.state !== 'closed') {
        decoder.close();
      }
      pendingFrames.forEach(frame => frame.close());
      pendingFrames = [];
    },

    get state() {
      return decoder.state;
    },

    getPendingFrames() {
      const frames = pendingFrames;
      pendingFrames = [];
      return frames;
    },
  };
}

export default {
  createVideoDecoder,
};
