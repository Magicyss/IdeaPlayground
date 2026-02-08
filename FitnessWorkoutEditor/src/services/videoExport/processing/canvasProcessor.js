/**
 * Canvas 2D Frame Processor
 * Fallback processor using Canvas 2D API
 */

/**
 * Create a Canvas 2D frame processor
 * @param {number} outputWidth - Target output width
 * @param {number} outputHeight - Target output height
 * @returns {Object} Canvas processor object
 */
export function createCanvasProcessor(outputWidth, outputHeight) {
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  return {
    async processFrame(frame, sourceWidth, sourceHeight) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const sourceAspect = sourceWidth / sourceHeight;
      const targetAspect = outputWidth / outputHeight;

      let destX, destY, destWidth, destHeight;

      if (sourceAspect > targetAspect) {
        destWidth = outputWidth;
        destHeight = Math.round(outputWidth / sourceAspect);
        destX = 0;
        destY = Math.round((outputHeight - destHeight) / 2);
      } else {
        destHeight = outputHeight;
        destWidth = Math.round(outputHeight * sourceAspect);
        destX = Math.round((outputWidth - destWidth) / 2);
        destY = 0;
      }

      ctx.drawImage(frame, destX, destY, destWidth, destHeight);

      const outputFrame = new VideoFrame(canvas, {
        timestamp: frame.timestamp,
        duration: frame.duration,
      });

      return outputFrame;
    },

    async compositeOverlay(baseFrame, overlay) {
      ctx.drawImage(baseFrame, 0, 0, outputWidth, outputHeight);
      ctx.drawImage(overlay, 0, 0);

      const outputFrame = new VideoFrame(canvas, {
        timestamp: baseFrame.timestamp,
        duration: baseFrame.duration,
      });

      return outputFrame;
    },

    async processAndComposite(frame, sourceWidth, sourceHeight, overlay) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const sourceAspect = sourceWidth / sourceHeight;
      const targetAspect = outputWidth / outputHeight;

      let destX, destY, destWidth, destHeight;

      if (sourceAspect > targetAspect) {
        destWidth = outputWidth;
        destHeight = Math.round(outputWidth / sourceAspect);
        destX = 0;
        destY = Math.round((outputHeight - destHeight) / 2);
      } else {
        destHeight = outputHeight;
        destWidth = Math.round(outputHeight * sourceAspect);
        destX = Math.round((outputWidth - destWidth) / 2);
        destY = 0;
      }

      ctx.drawImage(frame, destX, destY, destWidth, destHeight);

      if (overlay) {
        ctx.drawImage(overlay, 0, 0);
      }

      const outputFrame = new VideoFrame(canvas, {
        timestamp: frame.timestamp,
        duration: frame.duration,
      });

      return outputFrame;
    },

    createFrameFromCanvas(timestamp, duration, content) {
      ctx.drawImage(content, 0, 0, outputWidth, outputHeight);

      return new VideoFrame(canvas, {
        timestamp,
        duration,
      });
    },

    get canvas() {
      return canvas;
    },

    getContentArea(sourceWidth, sourceHeight) {
      const sourceAspect = sourceWidth / sourceHeight;
      const targetAspect = outputWidth / outputHeight;

      let destX, destY, destWidth, destHeight;

      if (sourceAspect > targetAspect) {
        destWidth = outputWidth;
        destHeight = Math.round(outputWidth / sourceAspect);
        destX = 0;
        destY = Math.round((outputHeight - destHeight) / 2);
      } else {
        destHeight = outputHeight;
        destWidth = Math.round(outputHeight * sourceAspect);
        destX = Math.round((outputWidth - destWidth) / 2);
        destY = 0;
      }

      return { x: destX, y: destY, width: destWidth, height: destHeight };
    },

    destroy() {},
  };
}

export default {
  createCanvasProcessor,
};
