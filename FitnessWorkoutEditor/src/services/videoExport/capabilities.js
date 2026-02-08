/**
 * Capability detection for video export
 * Detects WebGPU, WebCodecs, and fallback options
 */

/**
 * Detect available capabilities for video export
 * @returns {Object} Capability information
 */
export function detectCapabilities() {
  const webcodecs = typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';
  const webgpu = !!navigator.gpu;
  const audioWorklet = typeof AudioWorkletNode !== 'undefined';

  return {
    webcodecs,
    webgpu,
    audioWorklet,
    fallback: webcodecs ? (webgpu ? null : 'canvas2d') : 'unsupported',
    processingMode: webgpu ? 'webgpu' : (webcodecs ? 'canvas2d' : 'unsupported'),
  };
}

/**
 * Check if video export is supported in this browser
 * @returns {boolean}
 */
export function isExportSupported() {
  const caps = detectCapabilities();
  return caps.webcodecs;
}

/**
 * Check if hardware-accelerated encoding is available
 * @returns {Promise<boolean>}
 */
export async function isHardwareAccelerationAvailable() {
  if (typeof VideoEncoder === 'undefined') {
    return false;
  }

  try {
    const support = await VideoEncoder.isConfigSupported({
      codec: 'avc1.42001f',
      width: 1920,
      height: 1080,
      bitrate: 5_000_000,
      framerate: 30,
      hardwareAcceleration: 'prefer-hardware',
    });
    return support.supported;
  } catch {
    return false;
  }
}

/**
 * Get the best codec configuration for the current browser
 * @param {number} width - Output width
 * @param {number} height - Output height
 * @param {number} bitrate - Target bitrate in bps
 * @param {number} framerate - Target frame rate
 * @returns {Promise<Object>} Codec configuration
 */
export async function getBestVideoCodecConfig(width, height, bitrate, framerate) {
  const configs = [
    { codec: 'avc1.640028', profile: 'high' },
    { codec: 'avc1.4d0028', profile: 'main' },
    { codec: 'avc1.42001f', profile: 'baseline' },
  ];

  for (const { codec, profile } of configs) {
    try {
      const config = {
        codec,
        width,
        height,
        bitrate,
        framerate,
        hardwareAcceleration: 'prefer-hardware',
      };

      const support = await VideoEncoder.isConfigSupported(config);
      if (support.supported) {
        return { ...config, profile };
      }
    } catch {
      continue;
    }
  }

  return {
    codec: 'avc1.42001f',
    width,
    height,
    bitrate,
    framerate,
    profile: 'baseline',
  };
}

/**
 * Get the best audio codec configuration
 * @param {number} sampleRate - Sample rate
 * @param {number} numberOfChannels - Number of channels
 * @param {number} bitrate - Target bitrate
 * @returns {Promise<Object>} Audio codec configuration
 */
export async function getBestAudioCodecConfig(sampleRate = 44100, numberOfChannels = 2, bitrate = 128000) {
  if (typeof AudioEncoder === 'undefined') {
    return null;
  }

  const configs = [
    { codec: 'mp4a.40.2', name: 'AAC-LC' },
    { codec: 'opus', name: 'Opus' },
  ];

  for (const { codec, name } of configs) {
    try {
      const config = {
        codec,
        sampleRate,
        numberOfChannels,
        bitrate,
      };

      const support = await AudioEncoder.isConfigSupported(config);
      if (support.supported) {
        return { ...config, name };
      }
    } catch {
      continue;
    }
  }

  return null;
}

export default {
  detectCapabilities,
  isExportSupported,
  isHardwareAccelerationAvailable,
  getBestVideoCodecConfig,
  getBestAudioCodecConfig,
};
