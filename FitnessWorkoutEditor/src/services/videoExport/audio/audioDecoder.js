/**
 * Audio Decoder
 * Decodes audio from video files
 */

/**
 * Extract audio from a video file using AudioContext
 * @param {File|Blob} videoFile - Video file
 * @returns {Promise<AudioBuffer>} Decoded audio buffer
 */
export async function extractAudioFromVideo(videoFile) {
  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await videoFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    await audioContext.close();
  }
}

/**
 * Extract audio segment from a video file
 * @param {File|Blob} videoFile - Video file
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Promise<AudioBuffer>} Audio segment
 */
export async function extractAudioSegment(videoFile, startTime, endTime) {
  const fullAudio = await extractAudioFromVideo(videoFile);

  const sampleRate = fullAudio.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.min(Math.floor(endTime * sampleRate), fullAudio.length);
  const length = endSample - startSample;

  const audioContext = new AudioContext({ sampleRate });

  try {
    const segment = audioContext.createBuffer(
      fullAudio.numberOfChannels,
      length,
      sampleRate
    );

    for (let channel = 0; channel < fullAudio.numberOfChannels; channel++) {
      const sourceData = fullAudio.getChannelData(channel);
      const destData = segment.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        destData[i] = sourceData[startSample + i];
      }
    }

    return segment;
  } finally {
    await audioContext.close();
  }
}

export default {
  extractAudioFromVideo,
  extractAudioSegment,
};
