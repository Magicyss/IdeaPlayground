/**
 * Video export pipeline
 * Orchestrates the process of creating the final workout video
 */

import * as ffmpegService from './ffmpegService.js';
import { generateRestVideo, formatExerciseDetails } from './restFrameGenerator.js';

// Export stages
export const STAGES = {
  INITIALIZING: 'initializing',
  PROCESSING: 'processing',
  ENCODING: 'encoding',
  COMPLETE: 'complete',
  ERROR: 'error',
};

// Resolution presets
export const RESOLUTIONS = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
};

// Frame rate presets
export const FRAME_RATES = {
  '24': 24,
  '30': 30,
  '60': 60,
};

/**
 * Calculate total estimated duration of the workout video
 * @param {Array} exercises - Array of exercise objects
 * @param {boolean} includeRest - Whether to include rest periods
 * @returns {number} - Total duration in seconds
 */
export function calculateTotalDuration(exercises, includeRest = true) {
  let total = 0;

  exercises.forEach((ex, index) => {
    const clipDuration = ex.videoSource.endTime - ex.videoSource.startTime;
    const sets = ex.parameters.sets;

    if (ex.exerciseType === 'count') {
      // For count-based: clip plays once per rep, for each set
      const repsPerSet = ex.parameters.repsPerSet;
      total += clipDuration * repsPerSet * sets;
    } else {
      // For duration-based: loop clip to fill duration
      const durationPerSet = ex.parameters.durationSeconds;
      total += durationPerSet * sets;
    }

    if (includeRest) {
      // Rest between sets
      const restBetweenSets = ex.parameters.restBetweenSets || 0;
      total += restBetweenSets * (sets - 1);

      // Rest after exercise
      if (index < exercises.length - 1) {
        total += ex.restAfterExercise || 0;
      }
    }
  });

  return total;
}

/**
 * Export workout as video
 * @param {Object} options - Export options
 * @param {Array} options.exercises - Array of exercise objects
 * @param {Array} options.videos - Array of video objects with file references
 * @param {boolean} options.includeRest - Whether to include rest frames
 * @param {string} options.resolution - Output resolution ('720p', '1080p', '4k')
 * @param {string} options.frameRate - Output frame rate ('24', '30', '60')
 * @param {Object} options.translations - Translation object
 * @param {Function} options.onProgress - Progress callback
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @returns {Promise<Blob>} - Final video blob
 */
export async function exportWorkout(options) {
  const {
    exercises,
    videos,
    includeRest = true,
    resolution = '1080p',
    frameRate = '30',
    translations,
    onProgress,
    signal,
  } = options;

  const resolutionConfig = RESOLUTIONS[resolution] || RESOLUTIONS['1080p'];
  const { width, height } = resolutionConfig;
  const fps = FRAME_RATES[frameRate] || 30;

  let segmentIndex = 0;
  const segments = [];

  const reportProgress = (stage, detail = {}) => {
    if (onProgress) {
      onProgress({ stage, ...detail });
    }
  };

  const checkAborted = () => {
    if (signal?.aborted) {
      throw new Error('Export cancelled');
    }
  };

  try {
    // Stage 1: Initialize FFmpeg
    reportProgress(STAGES.INITIALIZING, { message: 'Loading FFmpeg...' });
    await ffmpegService.initFFmpeg();
    checkAborted();

    // Stage 2: Process each exercise
    reportProgress(STAGES.PROCESSING, { message: 'Processing videos...' });

    for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
      const exercise = exercises[exIndex];
      checkAborted();

      reportProgress(STAGES.PROCESSING, {
        message: `Processing: ${exercise.exerciseName}`,
        exerciseIndex: exIndex + 1,
        totalExercises: exercises.length,
        progress: exIndex / exercises.length,
      });

      // Find the video file for this exercise
      const videoInfo = videos.find(v => v.id === exercise.videoSource.videoId);
      if (!videoInfo || !videoInfo.file) {
        throw new Error(`Video not found for exercise: ${exercise.exerciseName}`);
      }

      // Write source video to FFmpeg filesystem
      const sourceFileName = `source_${exIndex}.mp4`;
      await ffmpegService.writeFile(sourceFileName, videoInfo.file);
      checkAborted();

      // Process each set
      const sets = exercise.parameters.sets;
      for (let setIndex = 0; setIndex < sets; setIndex++) {
        checkAborted();

        // Create segment for this set
        const segmentName = `segment_${String(segmentIndex).padStart(4, '0')}.mp4`;

        if (exercise.exerciseType === 'count') {
          // Count-based: repeat the clip
          await createCountBasedSegment(
            sourceFileName,
            exercise,
            segmentName
          );
        } else {
          // Duration-based: loop to fill duration
          await createDurationBasedSegment(
            sourceFileName,
            exercise,
            segmentName
          );
        }

        segments.push(segmentName);
        segmentIndex++;

        // Add rest between sets (not after last set)
        if (includeRest && setIndex < sets - 1 && exercise.parameters.restBetweenSets > 0) {
          const restSegmentName = `segment_${String(segmentIndex).padStart(4, '0')}.mp4`;
          await generateRestVideo({
            duration: exercise.parameters.restBetweenSets,
            restType: 'betweenSets',
            nextExerciseName: exercise.exerciseName,
            nextExerciseDetails: formatExerciseDetails(exercise, translations),
            currentSet: setIndex + 2,
            totalSets: sets,
            outputName: `rest_${segmentIndex}`,
            width,
            height,
            fps,
          }, translations);

          // Rename rest video to segment name
          const restData = await ffmpegService.readFile(`rest_${segmentIndex}.mp4`);
          await ffmpegService.writeFile(restSegmentName, restData);
          await ffmpegService.deleteFile(`rest_${segmentIndex}.mp4`);

          segments.push(restSegmentName);
          segmentIndex++;
        }
      }

      // Add rest after exercise (not after last exercise)
      if (includeRest && exIndex < exercises.length - 1 && exercise.restAfterExercise > 0) {
        const nextExercise = exercises[exIndex + 1];
        const restSegmentName = `segment_${String(segmentIndex).padStart(4, '0')}.mp4`;

        await generateRestVideo({
          duration: exercise.restAfterExercise,
          restType: 'betweenExercises',
          nextExerciseName: nextExercise.exerciseName,
          nextExerciseDetails: formatExerciseDetails(nextExercise, translations),
          outputName: `rest_${segmentIndex}`,
          width,
          height,
          fps,
        }, translations);

        // Rename rest video to segment name
        const restData = await ffmpegService.readFile(`rest_${segmentIndex}.mp4`);
        await ffmpegService.writeFile(restSegmentName, restData);
        await ffmpegService.deleteFile(`rest_${segmentIndex}.mp4`);

        segments.push(restSegmentName);
        segmentIndex++;
      }

      // Cleanup source video
      await ffmpegService.deleteFile(sourceFileName);
    }

    checkAborted();

    // Stage 3: Normalize and concatenate all segments
    reportProgress(STAGES.ENCODING, { message: 'Merging videos...', progress: 0 });

    // Normalize all segments to same resolution and codec
    const normalizedSegments = [];
    for (let i = 0; i < segments.length; i++) {
      checkAborted();
      const normalizedName = `normalized_${String(i).padStart(4, '0')}.mp4`;
      await normalizeSegment(segments[i], normalizedName, width, height, fps);
      normalizedSegments.push(normalizedName);

      // Delete original segment
      await ffmpegService.deleteFile(segments[i]);

      reportProgress(STAGES.ENCODING, {
        message: 'Normalizing videos...',
        progress: (i + 1) / segments.length * 0.5,
      });
    }

    checkAborted();

    // Create concat list
    const concatList = normalizedSegments.map(s => `file '${s}'`).join('\n');
    const encoder = new TextEncoder();
    await ffmpegService.writeFile('concat_list.txt', encoder.encode(concatList));

    reportProgress(STAGES.ENCODING, { message: 'Creating final video...', progress: 0.6 });

    // Concatenate all segments
    await ffmpegService.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat_list.txt',
      '-c', 'copy',
      'output.mp4',
    ]);

    checkAborted();

    reportProgress(STAGES.ENCODING, { message: 'Finalizing...', progress: 0.9 });

    // Read final output
    const outputData = await ffmpegService.readFile('output.mp4');
    const blob = new Blob([outputData], { type: 'video/mp4' });

    // Cleanup
    await ffmpegService.cleanup();

    reportProgress(STAGES.COMPLETE, { message: 'Export complete!' });

    return blob;
  } catch (error) {
    if (error.message === 'Export cancelled') {
      reportProgress(STAGES.ERROR, { message: 'Export cancelled' });
    } else {
      reportProgress(STAGES.ERROR, { message: error.message });
    }
    await ffmpegService.cleanup();
    throw error;
  }
}

/**
 * Create a count-based exercise segment (repeat clip for reps)
 */
async function createCountBasedSegment(sourceFile, exercise, outputFile) {
  const startTime = exercise.videoSource.startTime;
  const endTime = exercise.videoSource.endTime;
  const clipDuration = endTime - startTime;
  const repsPerSet = exercise.parameters.repsPerSet;

  // First, trim the clip
  const trimmedFile = `trimmed_${Date.now()}.mp4`;
  await ffmpegService.exec([
    '-ss', String(startTime),
    '-i', sourceFile,
    '-t', String(clipDuration),
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-y',
    trimmedFile,
  ]);

  // Loop the clip for the number of reps
  // Each clip play represents one rep
  if (repsPerSet <= 1) {
    // No looping needed
    const data = await ffmpegService.readFile(trimmedFile);
    await ffmpegService.writeFile(outputFile, data);
  } else {
    // Loop the video using stream_loop
    await ffmpegService.exec([
      '-stream_loop', String(repsPerSet - 1),
      '-i', trimmedFile,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-y',
      outputFile,
    ]);
  }

  await ffmpegService.deleteFile(trimmedFile);
}

/**
 * Create a duration-based exercise segment (loop to fill duration)
 */
async function createDurationBasedSegment(sourceFile, exercise, outputFile) {
  const startTime = exercise.videoSource.startTime;
  const endTime = exercise.videoSource.endTime;
  const clipDuration = endTime - startTime;
  const targetDuration = exercise.parameters.durationSeconds;

  // Calculate how many times to loop
  const loopCount = Math.ceil(targetDuration / clipDuration);

  // First, trim the source clip
  const trimmedFile = `trimmed_${Date.now()}.mp4`;
  await ffmpegService.exec([
    '-ss', String(startTime),
    '-i', sourceFile,
    '-t', String(clipDuration),
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-y',
    trimmedFile,
  ]);

  if (loopCount <= 1) {
    // No looping needed, just trim to target duration
    await ffmpegService.exec([
      '-i', trimmedFile,
      '-t', String(targetDuration),
      '-c', 'copy',
      '-y',
      outputFile,
    ]);
  } else {
    // Loop the video using stream_loop
    await ffmpegService.exec([
      '-stream_loop', String(loopCount - 1),
      '-i', trimmedFile,
      '-t', String(targetDuration),
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-y',
      outputFile,
    ]);
  }

  await ffmpegService.deleteFile(trimmedFile);
}

/**
 * Normalize segment to consistent format for concatenation
 * @param {string} inputFile - Input filename
 * @param {string} outputFile - Output filename
 * @param {number} width - Output width
 * @param {number} height - Output height
 * @param {number} fps - Output frame rate
 */
async function normalizeSegment(inputFile, outputFile, width, height, fps) {
  await ffmpegService.exec([
    '-i', inputFile,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
    '-r', String(fps),
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-ar', '44100',
    '-ac', '2',
    '-y',
    outputFile,
  ]);
}

export default {
  STAGES,
  calculateTotalDuration,
  exportWorkout,
};
