/**
 * MP4 Muxer
 * Wraps mp4-muxer library for creating MP4 files from encoded chunks
 */

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

/**
 * Create an MP4 muxer instance
 * @param {Object} options - Muxer options
 * @returns {Object} Muxer wrapper object
 */
export function createMp4Muxer({
  width,
  height,
  fps = 30,
  includeAudio = false,
  sampleRate = 44100,
  numberOfChannels = 2,
}) {
  const target = new ArrayBufferTarget();

  const muxerOptions = {
    target,
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  };

  if (includeAudio) {
    muxerOptions.audio = {
      codec: 'aac',
      sampleRate,
      numberOfChannels,
    };
  }

  const muxer = new Muxer(muxerOptions);

  let videoChunkCount = 0;
  let audioChunkCount = 0;
  let lastVideoTimestamp = 0;

  return {
    addVideoChunk(chunk, metadata) {
      muxer.addVideoChunk(chunk, metadata);
      videoChunkCount++;
      lastVideoTimestamp = chunk.timestamp;
    },

    addAudioChunk(chunk, metadata) {
      if (!includeAudio) {
        return;
      }
      muxer.addAudioChunk(chunk, metadata);
      audioChunkCount++;
    },

    finalize() {
      muxer.finalize();
      const buffer = target.buffer;
      return new Blob([buffer], { type: 'video/mp4' });
    },

    get stats() {
      return {
        videoChunks: videoChunkCount,
        audioChunks: audioChunkCount,
        lastVideoTimestamp,
        estimatedDuration: lastVideoTimestamp / 1_000_000,
      };
    },

    get muxer() {
      return muxer;
    },
  };
}

export default {
  createMp4Muxer,
};
