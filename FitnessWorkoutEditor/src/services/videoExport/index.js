/**
 * Video Export Module - Unified Entry Point
 *
 * WebCodecs + WebGPU based video export for workout videos.
 */

export {
  detectCapabilities,
  isExportSupported,
  isHardwareAccelerationAvailable,
  getBestVideoCodecConfig,
  getBestAudioCodecConfig,
} from './capabilities.js';

export {
  STAGES,
  RESOLUTIONS,
  FRAME_RATES,
  calculateTotalDuration,
  exportWorkout,
} from './pipeline/exportPipeline.js';

export { createProcessor, getProcessorTypeDescription } from './processing/processorFactory.js';

export { createOverlayRenderer } from './rendering/overlayRenderer.js';
export { createRestFrameRenderer, formatExerciseDetails } from './rendering/restFrameRenderer.js';

export { generateCountdownBeeps, generateStartBeep, generateSilence } from './audio/soundEffects.js';
export { createAudioMixer, mixAudioBuffers } from './audio/audioMixer.js';

import { isExportSupported as _isExportSupported } from './capabilities.js';

/**
 * Check if the browser supports video export
 * Replaces the old FFmpeg-based isSupported() check
 * @returns {boolean}
 */
export function isSupported() {
  return _isExportSupported();
}

/**
 * Cleanup function (no-op for WebCodecs, kept for compatibility)
 */
export function terminate() {
  // No-op: WebCodecs resources are cleaned up automatically
}

export default {
  isSupported,
  terminate,
};
