/**
 * FFmpeg.wasm service for video processing in the browser
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let loaded = false;
let currentAbortController = null;

/**
 * Check if browser supports FFmpeg.wasm (SharedArrayBuffer + Cross-Origin Isolation)
 */
export function isSupported() {
  return typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated;
}

/**
 * Initialize FFmpeg.wasm (lazy loading)
 * @param {Function} onProgress - Progress callback for loading
 * @returns {Promise<FFmpeg>}
 */
export async function initFFmpeg(onProgress = null) {
  if (loaded && ffmpeg) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  // Set up progress handler
  if (onProgress) {
    ffmpeg.on('progress', ({ progress, time }) => {
      onProgress({ progress, time });
    });
  }

  // Set up log handler for debugging
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  // Load FFmpeg core from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  loaded = true;
  return ffmpeg;
}

/**
 * Write a file to FFmpeg virtual filesystem
 * @param {string} name - Filename in virtual filesystem
 * @param {File|Blob|Uint8Array|string} data - File data
 */
export async function writeFile(name, data) {
  if (!ffmpeg || !loaded) {
    throw new Error('FFmpeg not initialized');
  }

  if (data instanceof File || data instanceof Blob) {
    const buffer = await fetchFile(data);
    await ffmpeg.writeFile(name, buffer);
  } else if (data instanceof Uint8Array) {
    await ffmpeg.writeFile(name, data);
  } else if (typeof data === 'string') {
    // Assume it's a URL
    const buffer = await fetchFile(data);
    await ffmpeg.writeFile(name, buffer);
  } else {
    throw new Error('Unsupported data type');
  }
}

/**
 * Read a file from FFmpeg virtual filesystem
 * @param {string} name - Filename in virtual filesystem
 * @returns {Promise<Uint8Array>}
 */
export async function readFile(name) {
  if (!ffmpeg || !loaded) {
    throw new Error('FFmpeg not initialized');
  }
  return await ffmpeg.readFile(name);
}

/**
 * Delete a file from FFmpeg virtual filesystem
 * @param {string} name - Filename in virtual filesystem
 */
export async function deleteFile(name) {
  if (!ffmpeg || !loaded) {
    throw new Error('FFmpeg not initialized');
  }
  try {
    await ffmpeg.deleteFile(name);
  } catch (e) {
    // File might not exist, ignore error
    console.warn(`Could not delete file ${name}:`, e.message);
  }
}

/**
 * List files in FFmpeg virtual filesystem directory
 * @param {string} dir - Directory path
 * @returns {Promise<string[]>}
 */
export async function listDir(dir = '.') {
  if (!ffmpeg || !loaded) {
    throw new Error('FFmpeg not initialized');
  }
  return await ffmpeg.listDir(dir);
}

/**
 * Execute FFmpeg command with abort support
 * @param {string[]} args - FFmpeg command arguments
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<void>}
 */
export async function exec(args, signal = null) {
  if (!ffmpeg || !loaded) {
    throw new Error('FFmpeg not initialized');
  }

  // Check if already aborted
  if (signal?.aborted) {
    throw new Error('Export cancelled');
  }

  // Store abort controller reference for potential termination
  if (signal) {
    const abortHandler = () => {
      // FFmpeg.wasm doesn't support mid-execution cancellation well,
      // but we can terminate the instance
      console.log('[FFmpeg] Abort requested, terminating...');
      try {
        ffmpeg.terminate();
        ffmpeg = null;
        loaded = false;
      } catch (e) {
        console.warn('Error terminating FFmpeg:', e);
      }
    };

    signal.addEventListener('abort', abortHandler, { once: true });

    try {
      await ffmpeg.exec(args);
    } finally {
      signal.removeEventListener('abort', abortHandler);
    }
  } else {
    await ffmpeg.exec(args);
  }
}

/**
 * Set progress callback for FFmpeg operations
 * @param {Function} callback - Progress callback ({ progress, time })
 */
export function setProgressCallback(callback) {
  if (ffmpeg) {
    ffmpeg.on('progress', callback);
  }
}

/**
 * Cleanup and reset FFmpeg state
 */
export async function cleanup() {
  if (ffmpeg && loaded) {
    // List and delete all files in virtual filesystem
    try {
      const files = await ffmpeg.listDir('.');
      for (const file of files) {
        if (file.name !== '.' && file.name !== '..') {
          try {
            await ffmpeg.deleteFile(file.name);
          } catch (e) {
            // Ignore errors
          }
        }
      }
    } catch (e) {
      console.warn('Cleanup error:', e);
    }
  }
}

/**
 * Get FFmpeg instance (must be initialized first)
 * @returns {FFmpeg}
 */
export function getFFmpeg() {
  if (!ffmpeg || !loaded) {
    throw new Error('FFmpeg not initialized');
  }
  return ffmpeg;
}

/**
 * Terminate FFmpeg instance
 */
export function terminate() {
  if (ffmpeg) {
    try {
      ffmpeg.terminate();
    } catch (e) {
      console.warn('Error terminating FFmpeg:', e);
    }
    ffmpeg = null;
    loaded = false;
  }
}

/**
 * Check if FFmpeg is loaded
 */
export function isLoaded() {
  return loaded && ffmpeg !== null;
}

export default {
  isSupported,
  initFFmpeg,
  writeFile,
  readFile,
  deleteFile,
  listDir,
  exec,
  setProgressCallback,
  cleanup,
  getFFmpeg,
  terminate,
  isLoaded,
};
