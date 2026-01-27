/**
 * Rest frame generator using Canvas
 * Generates countdown frames for rest periods between sets/exercises
 */

import * as ffmpegService from './ffmpegService.js';

// Colors
const COLORS = {
  background: '#1a1a2e',
  primary: '#16213e',
  accent: '#0f3460',
  text: '#ffffff',
  highlight: '#e94560',
  secondary: '#a0a0a0',
};

/**
 * Create a canvas element for rendering
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {HTMLCanvasElement}
 */
function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Calculate font sizes based on resolution
 * @param {number} height - Canvas height
 * @returns {Object} - Font sizes
 */
function getFontSizes(height) {
  // Base sizes for 720p, scale proportionally
  const scale = height / 720;
  return {
    title: Math.round(36 * scale),
    countdown: Math.round(180 * scale),
    setInfo: Math.round(28 * scale),
    nextLabel: Math.round(32 * scale),
    nextName: Math.round(48 * scale),
    nextDetails: Math.round(28 * scale),
  };
}

/**
 * Render a single rest frame
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} options - Render options
 * @param {number} options.countdown - Current countdown value in seconds
 * @param {string} options.restType - 'betweenSets' or 'betweenExercises'
 * @param {string} options.nextExerciseName - Name of the next exercise
 * @param {string} options.nextExerciseDetails - Details like "15 reps × 3 sets"
 * @param {number} options.currentSet - Current set number (for set rest)
 * @param {number} options.totalSets - Total sets (for set rest)
 * @param {Object} translations - Translation object with t function
 */
function renderRestFrame(ctx, width, height, options, translations) {
  const { countdown, restType, nextExerciseName, nextExerciseDetails, currentSet, totalSets } = options;
  const t = translations?.t || ((key) => key);
  const fonts = getFontSizes(height);

  // Clear canvas with gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.background);
  gradient.addColorStop(1, COLORS.primary);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Rest type title
  ctx.fillStyle = COLORS.secondary;
  ctx.font = `bold ${fonts.title}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleText = restType === 'betweenSets'
    ? t('rest.betweenSets')
    : t('rest.betweenExercises');
  ctx.fillText(titleText, width / 2, height * 0.167);

  // Large countdown display
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  ctx.fillStyle = COLORS.text;
  ctx.font = `bold ${fonts.countdown}px Arial, sans-serif`;
  ctx.fillText(timeText, width / 2, height / 2 - height * 0.042);

  // Set info (if between sets)
  if (restType === 'betweenSets' && currentSet && totalSets) {
    ctx.fillStyle = COLORS.secondary;
    ctx.font = `${fonts.setInfo}px Arial, sans-serif`;
    const setInfoText = t('rest.preparingSet')
      .replace('{current}', currentSet)
      .replace('{total}', totalSets);
    ctx.fillText(setInfoText, width / 2, height / 2 + height * 0.111);
  }

  // Next exercise info
  if (nextExerciseName) {
    ctx.fillStyle = COLORS.highlight;
    ctx.font = `bold ${fonts.nextLabel}px Arial, sans-serif`;
    ctx.fillText(t('rest.nextExercise'), width / 2, height - height * 0.25);

    ctx.fillStyle = COLORS.text;
    ctx.font = `bold ${fonts.nextName}px Arial, sans-serif`;
    ctx.fillText(nextExerciseName, width / 2, height - height * 0.167);

    if (nextExerciseDetails) {
      ctx.fillStyle = COLORS.secondary;
      ctx.font = `${fonts.nextDetails}px Arial, sans-serif`;
      ctx.fillText(nextExerciseDetails, width / 2, height - height * 0.097);
    }
  }
}

/**
 * Generate a PNG blob from canvas
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

/**
 * Generate rest video clip
 * @param {Object} options - Generation options
 * @param {number} options.duration - Duration in seconds
 * @param {string} options.restType - 'betweenSets' or 'betweenExercises'
 * @param {string} options.nextExerciseName - Name of next exercise
 * @param {string} options.nextExerciseDetails - Details of next exercise
 * @param {number} options.currentSet - Current set number
 * @param {number} options.totalSets - Total sets
 * @param {string} options.outputName - Output filename (without extension)
 * @param {number} options.width - Video width (default 1920)
 * @param {number} options.height - Video height (default 1080)
 * @param {number} options.fps - Frame rate (default 30)
 * @param {Object} translations - Translation object
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} - Output filename in FFmpeg filesystem
 */
export async function generateRestVideo(options, translations, onProgress = null) {
  const {
    duration,
    restType,
    nextExerciseName,
    nextExerciseDetails,
    currentSet,
    totalSets,
    outputName = 'rest',
    width = 1920,
    height = 1080,
    fps = 30,
  } = options;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Generate frames (1 frame per second for countdown)
  const frameCount = duration;

  for (let i = 0; i < frameCount; i++) {
    const countdown = duration - i;

    renderRestFrame(ctx, width, height, {
      countdown,
      restType,
      nextExerciseName,
      nextExerciseDetails,
      currentSet,
      totalSets,
    }, translations);

    const blob = await canvasToBlob(canvas);
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Write frame to FFmpeg filesystem with 4-digit padding
    const frameName = `${outputName}_frame_${String(i).padStart(4, '0')}.png`;
    await ffmpegService.writeFile(frameName, uint8Array);

    if (onProgress) {
      onProgress({ frame: i + 1, totalFrames: frameCount, phase: 'generating' });
    }
  }

  // Convert frames to video using FFmpeg
  // Input: 1 frame per second of countdown
  // Use -vf fps to duplicate frames to reach target fps while keeping 1 second per frame
  const outputFile = `${outputName}.mp4`;

  await ffmpegService.exec([
    '-framerate', '1', // Input: 1 frame = 1 second of countdown
    '-i', `${outputName}_frame_%04d.png`,
    '-vf', `fps=${fps}`, // Duplicate frames to target fps (keeps timing correct)
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-t', String(duration),
    outputFile,
  ]);

  // Cleanup frame files
  for (let i = 0; i < frameCount; i++) {
    const frameName = `${outputName}_frame_${String(i).padStart(4, '0')}.png`;
    await ffmpegService.deleteFile(frameName);
  }

  if (onProgress) {
    onProgress({ frame: frameCount, totalFrames: frameCount, phase: 'complete' });
  }

  return outputFile;
}

/**
 * Format exercise details for display
 * @param {Object} exercise - Exercise object
 * @param {Object} translations - Translation object
 * @returns {string}
 */
export function formatExerciseDetails(exercise, translations) {
  const t = translations?.t || ((key) => key);

  if (exercise.exerciseType === 'count') {
    return t('rest.nextExerciseDetails')
      .replace('{reps}', exercise.parameters.repsPerSet)
      .replace('{sets}', exercise.parameters.sets);
  } else {
    return t('rest.nextExerciseDuration')
      .replace('{duration}', exercise.parameters.durationSeconds)
      .replace('{sets}', exercise.parameters.sets);
  }
}

export default {
  generateRestVideo,
  formatExerciseDetails,
};
