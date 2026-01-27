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
  // Each frame should display for 1 second
  // Use -r for output framerate and loop_input to hold each frame
  const outputFile = `${outputName}.mp4`;

  await ffmpegService.exec([
    '-framerate', '1',  // Input: 1 frame per second
    '-i', `${outputName}_frame_%04d.png`,
    '-c:v', 'libx264',
    '-r', String(fps),  // Output framerate
    '-pix_fmt', 'yuv420p',
    '-vf', `fps=${fps},format=yuv420p`,  // Ensure proper frame duplication
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

/**
 * Generate overlay image for exercise video
 * Shows current rep/duration and set information
 * @param {Object} options - Generation options
 * @param {string} options.exerciseName - Exercise name
 * @param {number} options.currentRep - Current rep number (for count-based)
 * @param {number} options.totalReps - Total reps (for count-based)
 * @param {number} options.currentSet - Current set number
 * @param {number} options.totalSets - Total sets
 * @param {number} options.remainingSeconds - Remaining seconds (for duration-based)
 * @param {string} options.exerciseType - 'count' or 'duration'
 * @param {number} options.width - Video width
 * @param {number} options.height - Video height
 * @param {Object} translations - Translation object
 * @returns {Promise<Uint8Array>} - PNG image data
 */
export async function generateOverlayImage(options, translations) {
  const {
    exerciseName,
    currentRep,
    totalReps,
    currentSet,
    totalSets,
    remainingSeconds,
    exerciseType,
    width = 1920,
    height = 1080,
  } = options;

  const t = translations?.t || ((key) => key);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Clear canvas (transparent)
  ctx.clearRect(0, 0, width, height);

  const fonts = getFontSizes(height);

  // Semi-transparent background bar at top
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, width, height * 0.12);

  // Exercise name (top left)
  ctx.fillStyle = COLORS.text;
  ctx.font = `bold ${fonts.nextName}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(exerciseName, width * 0.03, height * 0.06);

  // Set info (top right)
  ctx.textAlign = 'right';
  ctx.font = `bold ${fonts.nextLabel}px Arial, sans-serif`;
  const setText = t('overlay.set')
    .replace('{current}', currentSet)
    .replace('{total}', totalSets);
  ctx.fillText(setText, width * 0.97, height * 0.06);

  // Rep/Duration info (bottom center, with background)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  const bottomBarHeight = height * 0.1;
  ctx.fillRect(0, height - bottomBarHeight, width, bottomBarHeight);

  ctx.fillStyle = COLORS.highlight;
  ctx.font = `bold ${fonts.countdown * 0.4}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (exerciseType === 'count') {
    const repText = t('overlay.rep')
      .replace('{current}', currentRep)
      .replace('{total}', totalReps);
    ctx.fillText(repText, width / 2, height - bottomBarHeight / 2);
  } else {
    const durationText = t('overlay.duration')
      .replace('{seconds}', remainingSeconds);
    ctx.fillText(durationText, width / 2, height - bottomBarHeight / 2);
  }

  const blob = await canvasToBlob(canvas);
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate all overlay frames for an exercise segment
 * Optimized: generates 1 frame per second, FFmpeg will duplicate to target fps
 * @param {Object} options - Generation options
 * @param {Object} options.exercise - Exercise object
 * @param {number} options.setIndex - Current set index (0-based)
 * @param {number} options.clipDuration - Duration of one clip in seconds
 * @param {number} options.width - Video width
 * @param {number} options.height - Video height
 * @param {number} options.fps - Frame rate
 * @param {string} options.outputPrefix - Output filename prefix
 * @param {Object} translations - Translation object
 * @returns {Promise<{overlayFile: string, duration: number}>}
 */
export async function generateExerciseOverlayVideo(options, translations) {
  const {
    exercise,
    setIndex,
    clipDuration,
    width = 1920,
    height = 1080,
    fps = 30,
    outputPrefix = 'overlay',
  } = options;

  const t = translations?.t || ((key) => key);
  const isCountBased = exercise.exerciseType === 'count';
  const repsPerSet = exercise.parameters.repsPerSet;
  const totalSets = exercise.parameters.sets;
  const durationSeconds = exercise.parameters.durationSeconds;

  let totalDuration;

  if (isCountBased) {
    // Count-based: clip plays once per rep
    totalDuration = clipDuration * repsPerSet;
  } else {
    // Duration-based: loop to fill duration
    totalDuration = durationSeconds;
  }

  // Generate 1 frame per second (optimized)
  const frameCount = Math.ceil(totalDuration);

  for (let second = 0; second < frameCount; second++) {
    const currentTime = second;

    let overlayOptions;
    if (isCountBased) {
      // Calculate current rep based on time
      const currentRep = Math.min(
        Math.floor(currentTime / clipDuration) + 1,
        repsPerSet
      );
      overlayOptions = {
        exerciseName: exercise.exerciseName,
        currentRep,
        totalReps: repsPerSet,
        currentSet: setIndex + 1,
        totalSets,
        exerciseType: 'count',
        width,
        height,
      };
    } else {
      // Duration-based: show remaining time
      const remainingSeconds = Math.max(0, Math.ceil(durationSeconds - currentTime));
      overlayOptions = {
        exerciseName: exercise.exerciseName,
        currentSet: setIndex + 1,
        totalSets,
        remainingSeconds,
        exerciseType: 'duration',
        width,
        height,
      };
    }

    const overlayData = await generateOverlayImage(overlayOptions, translations);
    const frameName = `${outputPrefix}_frame_${String(second).padStart(4, '0')}.png`;
    await ffmpegService.writeFile(frameName, overlayData);
  }

  // Convert frames to video - 1 frame per second input, output at target fps
  const overlayFile = `${outputPrefix}.mov`;

  await ffmpegService.exec([
    '-framerate', '1',  // Input: 1 frame per second
    '-i', `${outputPrefix}_frame_%04d.png`,
    '-c:v', 'png',
    '-r', String(fps),  // Output at target fps
    '-pix_fmt', 'rgba',
    overlayFile,
  ]);

  // Cleanup frame files
  for (let second = 0; second < frameCount; second++) {
    const frameName = `${outputPrefix}_frame_${String(second).padStart(4, '0')}.png`;
    await ffmpegService.deleteFile(frameName);
  }

  return { overlayFile, duration: totalDuration };
}

export default {
  generateRestVideo,
  formatExerciseDetails,
  generateOverlayImage,
  generateExerciseOverlayVideo,
};
