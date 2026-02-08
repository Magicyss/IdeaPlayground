/**
 * Frame Extractor
 * Extracts frames from video files using WebCodecs
 */

/**
 * Create a frame extractor for a video file
 * @param {File|Blob} videoFile - Video file to extract frames from
 * @returns {Promise<Object>} Frame extractor control object
 */
export async function createFrameExtractor(videoFile) {
  const videoUrl = URL.createObjectURL(videoFile);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = videoUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  return {
    get metadata() {
      return {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        frameRate: 30,
      };
    },

    async getFrameAtTime(time) {
      const clampedTime = Math.max(0, Math.min(time, video.duration - 0.001));
      video.currentTime = clampedTime;

      await new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });

      ctx.drawImage(video, 0, 0);

      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(clampedTime * 1_000_000),
        duration: Math.round(1_000_000 / 30),
      });

      return frame;
    },

    async extractFrames(times, onFrame, onProgress) {
      for (let i = 0; i < times.length; i++) {
        const frame = await this.getFrameAtTime(times[i]);
        await onFrame(frame, times[i], i);
        if (onProgress) {
          onProgress((i + 1) / times.length);
        }
      }
    },

    get videoElement() {
      return video;
    },

    close() {
      video.src = '';
      URL.revokeObjectURL(videoUrl);
    },
  };
}

export function createVideoFrameFromCanvas(canvas, timestamp, duration) {
  return new VideoFrame(canvas, {
    timestamp,
    duration,
  });
}

export default {
  createFrameExtractor,
  createVideoFrameFromCanvas,
};
