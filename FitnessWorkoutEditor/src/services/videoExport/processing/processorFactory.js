/**
 * Processor Factory
 * Creates the appropriate frame processor based on browser capabilities
 */

import { detectCapabilities } from '../capabilities.js';
import { createCanvasProcessor } from './canvasProcessor.js';

/**
 * Create the best available frame processor
 * @param {number} width - Output width
 * @param {number} height - Output height
 * @returns {Promise<Object>} Frame processor
 */
export async function createProcessor(width, height) {
  const caps = detectCapabilities();

  // For now, always use Canvas 2D (WebGPU requires more complex setup)
  const processor = createCanvasProcessor(width, height);
  console.log('[ProcessorFactory] Using Canvas 2D processor');
  return {
    processor,
    type: caps.webgpu ? 'canvas2d' : 'canvas2d',
  };
}

/**
 * Get processor type description for UI
 * @returns {string}
 */
export function getProcessorTypeDescription() {
  const caps = detectCapabilities();

  if (caps.webgpu) {
    return 'GPU Accelerated';
  } else if (caps.webcodecs) {
    return 'CPU Processing';
  } else {
    return 'Not Supported';
  }
}

export default {
  createProcessor,
  getProcessorTypeDescription,
};
