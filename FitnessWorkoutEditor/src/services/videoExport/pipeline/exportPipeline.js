/**
 * Export Pipeline
 * Orchestrates the WebCodecs-based video export process
 */

import { detectCapabilities, isExportSupported } from '../capabilities.js';
import { createFrameExtractor } from '../webcodecs/frameExtractor.js';
import { createVideoEncoder } from '../webcodecs/encoder.js';
import { createProcessor } from '../processing/processorFactory.js';
import { createMp4Muxer } from '../muxing/mp4Muxer.js';
import { createOverlayRenderer } from '../rendering/overlayRenderer.js';
import { createRestFrameRenderer, formatExerciseDetails } from '../rendering/restFrameRenderer.js';
import { generateCountdownBeeps } from '../audio/soundEffects.js';
import { mixAudioBuffers } from '../audio/audioMixer.js';
import { extractAudioFromVideo } from '../audio/audioDecoder.js';
import { createAudioEncoder, isAudioEncodingSupported } from '../audio/audioEncoder.js';

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
  // Portrait resolutions
  '720p-portrait': { width: 720, height: 1280 },
  '1080p-portrait': { width: 1080, height: 1920 },
  '4k-portrait': { width: 2160, height: 3840 },
};

// Frame rate presets
export const FRAME_RATES = {
  '24': 24,
  '30': 30,
  '60': 60,
};

/**
 * Calculate total estimated duration of the workout video
 */
export function calculateTotalDuration(exercises, includeRest = true) {
  let total = 0;

  exercises.forEach((ex, index) => {
    const clipDuration = ex.videoSource.endTime - ex.videoSource.startTime;
    const sets = ex.parameters.sets;

    if (ex.exerciseType === 'count') {
      const repsPerSet = ex.parameters.repsPerSet;
      total += clipDuration * repsPerSet * sets;
    } else {
      const durationPerSet = ex.parameters.durationSeconds;
      total += durationPerSet * sets;
    }

    if (includeRest) {
      const restBetweenSets = ex.parameters.restBetweenSets || 0;
      total += restBetweenSets * (sets - 1);

      if (index < exercises.length - 1) {
        total += ex.restAfterExercise || 0;
      }
    }
  });

  return total;
}

/**
 * Export workout as video using WebCodecs
 */
export async function exportWorkout(options) {
  const {
    exercises,
    videos,
    includeRest = true,
    resolution = '1080p',
    frameRate = '30',
    includeOriginalAudio = false,
    includeCountdownBeeps = true,
    translations,
    onProgress,
    signal,
  } = options;

  if (!isExportSupported()) {
    throw new Error('WebCodecs not supported in this browser');
  }

  const resolutionConfig = RESOLUTIONS[resolution] || RESOLUTIONS['1080p'];
  const { width, height } = resolutionConfig;
  const fps = FRAME_RATES[frameRate] || 30;
  const frameDuration = Math.round(1_000_000 / fps);
  const sampleRate = 44100;
  const numberOfChannels = 2;

  const includeAudio = includeOriginalAudio || includeCountdownBeeps;

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

  const cleanupResources = [];

  try {
    reportProgress(STAGES.INITIALIZING, { message: 'Initializing...' });

    const caps = detectCapabilities();
    console.log('[ExportPipeline] Capabilities:', caps);

    const { processor } = await createProcessor(width, height);
    cleanupResources.push(() => processor.destroy?.());

    const overlayRenderer = createOverlayRenderer(width, height);
    const restFrameRenderer = createRestFrameRenderer(width, height);

    const muxer = createMp4Muxer({
      width,
      height,
      fps,
      includeAudio,
      sampleRate,
      numberOfChannels,
    });

    // Prepare countdown beeps if needed
    let countdownBeeps = null;
    if (includeCountdownBeeps) {
      countdownBeeps = await generateCountdownBeeps({ sampleRate });
    }

    // Track audio sources for mixing later
    const audioSources = [];

    let encoderError = null;
    const encoder = await createVideoEncoder({
      width,
      height,
      bitrate: resolution === '4k' ? 15_000_000 : (resolution === '1080p' ? 8_000_000 : 5_000_000),
      framerate: fps,
      onChunk: (chunk, metadata) => {
        muxer.addVideoChunk(chunk, metadata);
      },
      onError: (error) => {
        // Store error to check after encoding
        encoderError = error;
      },
    });
    cleanupResources.push(() => encoder.close());

    const checkEncoderError = () => {
      if (encoderError) {
        throw encoderError;
      }
    };

    checkAborted();

    reportProgress(STAGES.PROCESSING, { message: 'Processing videos...' });

    // Pre-extract audio from all source videos if needed
    const videoAudioCache = new Map();
    if (includeOriginalAudio) {
      reportProgress(STAGES.PROCESSING, { message: 'Extracting audio...' });
      for (const video of videos) {
        if (video.file) {
          try {
            const audioBuffer = await extractAudioFromVideo(video.file);
            videoAudioCache.set(video.id, audioBuffer);
          } catch (e) {
            console.warn(`[ExportPipeline] Could not extract audio from video ${video.id}:`, e);
          }
        }
      }
    }

    let currentTimestamp = 0;
    let currentTimeSeconds = 0; // Track time in seconds for audio
    let totalFrames = 0;
    const totalDuration = calculateTotalDuration(exercises, includeRest);
    const estimatedTotalFrames = Math.ceil(totalDuration * fps);

    for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
      const exercise = exercises[exIndex];
      checkAborted();

      reportProgress(STAGES.PROCESSING, {
        message: `Processing: ${exercise.exerciseName}`,
        exerciseIndex: exIndex + 1,
        totalExercises: exercises.length,
        progress: totalFrames / estimatedTotalFrames,
      });

      const videoInfo = videos.find(v => v.id === exercise.videoSource.videoId);
      if (!videoInfo || !videoInfo.file) {
        throw new Error(`Video not found for exercise: ${exercise.exerciseName}`);
      }

      const extractor = await createFrameExtractor(videoInfo.file);
      cleanupResources.push(() => extractor.close());

      const sourceWidth = extractor.metadata.width;
      const sourceHeight = extractor.metadata.height;

      const sets = exercise.parameters.sets;
      const clipStartTime = exercise.videoSource.startTime;
      const clipEndTime = exercise.videoSource.endTime;
      const clipDuration = clipEndTime - clipStartTime;

      for (let setIndex = 0; setIndex < sets; setIndex++) {
        checkAborted();

        let segmentDuration;
        if (exercise.exerciseType === 'count') {
          segmentDuration = clipDuration * exercise.parameters.repsPerSet;
        } else {
          segmentDuration = exercise.parameters.durationSeconds;
        }

        for (let frameIndex = 0; frameIndex < Math.ceil(segmentDuration * fps); frameIndex++) {
          checkAborted();

          const frameTime = frameIndex / fps;
          const sourceTime = clipStartTime + (frameTime % clipDuration);

          const sourceFrame = await extractor.getFrameAtTime(sourceTime);

          let overlayOptions;
          if (exercise.exerciseType === 'count') {
            const currentRep = Math.min(
              Math.floor(frameTime / clipDuration) + 1,
              exercise.parameters.repsPerSet
            );
            overlayOptions = {
              exerciseName: exercise.exerciseName,
              currentRep,
              totalReps: exercise.parameters.repsPerSet,
              currentSet: setIndex + 1,
              totalSets: sets,
              exerciseType: 'count',
              contentArea: processor.getContentArea?.(sourceWidth, sourceHeight),
            };
          } else {
            const remainingSeconds = Math.max(0, Math.ceil(segmentDuration - frameTime));
            overlayOptions = {
              exerciseName: exercise.exerciseName,
              currentSet: setIndex + 1,
              totalSets: sets,
              remainingSeconds,
              exerciseType: 'duration',
              contentArea: processor.getContentArea?.(sourceWidth, sourceHeight),
            };
          }

          const overlayCanvas = overlayRenderer.renderExerciseOverlay(overlayOptions, translations);

          const outputFrame = await processor.processAndComposite(
            sourceFrame,
            sourceWidth,
            sourceHeight,
            overlayCanvas
          );

          sourceFrame.close();

          const frameTimestamp = currentTimestamp + frameIndex * frameDuration;
          const finalFrame = new VideoFrame(outputFrame, {
            timestamp: frameTimestamp,
            duration: frameDuration,
          });
          outputFrame.close();

          const isKeyFrame = frameIndex % (fps * 2) === 0;
          encoder.encode(finalFrame, { keyFrame: isKeyFrame });
          finalFrame.close();
          checkEncoderError();

          totalFrames++;
        }

        currentTimestamp += Math.round(segmentDuration * 1_000_000);

        // Track audio segment for this exercise segment
        if (includeOriginalAudio) {
          const videoAudio = videoAudioCache.get(exercise.videoSource.videoId);
          if (videoAudio) {
            audioSources.push({
              buffer: videoAudio,
              startTime: currentTimeSeconds,
              volume: 1,
              loop: true,
              duration: segmentDuration,
              sourceStart: clipStartTime,
              sourceEnd: clipEndTime,
            });
          }
        }
        currentTimeSeconds += segmentDuration;

        // Rest between sets
        if (includeRest && setIndex < sets - 1 && exercise.parameters.restBetweenSets > 0) {
          const restDuration = exercise.parameters.restBetweenSets;
          const restStartTime = currentTimeSeconds;

          for (let second = 0; second < restDuration; second++) {
            for (let subFrame = 0; subFrame < fps; subFrame++) {
              checkAborted();

              const countdown = restDuration - second;
              const restCanvas = restFrameRenderer.renderRestFrame({
                countdown,
                restType: 'betweenSets',
                nextExerciseName: exercise.exerciseName,
                nextExerciseDetails: formatExerciseDetails(exercise, translations),
                currentSet: setIndex + 2,
                totalSets: sets,
              }, translations);

              const restFrame = new VideoFrame(restCanvas, {
                timestamp: currentTimestamp + (second * fps + subFrame) * frameDuration,
                duration: frameDuration,
              });

              const isKeyFrame = (second * fps + subFrame) % (fps * 2) === 0;
              encoder.encode(restFrame, { keyFrame: isKeyFrame });
              restFrame.close();
              checkEncoderError();

              totalFrames++;
            }
          }

          // Add countdown beeps for rest between sets
          if (includeCountdownBeeps && countdownBeeps) {
            const { countdownBeep, startBeep, countdownSeconds } = countdownBeeps;
            const restEndTime = restStartTime + restDuration;
            for (let i = countdownSeconds; i >= 1; i--) {
              const beepTime = restEndTime - i;
              if (beepTime >= restStartTime) {
                audioSources.push({
                  buffer: countdownBeep,
                  startTime: beepTime,
                  volume: 0.6,
                });
              }
            }
            audioSources.push({
              buffer: startBeep,
              startTime: restEndTime,
              volume: 0.7,
            });
          }

          currentTimestamp += Math.round(restDuration * 1_000_000);
          currentTimeSeconds += restDuration;
        }
      }

      // Rest after exercise
      if (includeRest && exIndex < exercises.length - 1 && exercise.restAfterExercise > 0) {
        const restDuration = exercise.restAfterExercise;
        const nextExercise = exercises[exIndex + 1];
        const restStartTime = currentTimeSeconds;

        for (let second = 0; second < restDuration; second++) {
          for (let subFrame = 0; subFrame < fps; subFrame++) {
            checkAborted();

            const countdown = restDuration - second;
            const restCanvas = restFrameRenderer.renderRestFrame({
              countdown,
              restType: 'betweenExercises',
              nextExerciseName: nextExercise.exerciseName,
              nextExerciseDetails: formatExerciseDetails(nextExercise, translations),
            }, translations);

            const restFrame = new VideoFrame(restCanvas, {
              timestamp: currentTimestamp + (second * fps + subFrame) * frameDuration,
              duration: frameDuration,
            });

            const isKeyFrame = (second * fps + subFrame) % (fps * 2) === 0;
            encoder.encode(restFrame, { keyFrame: isKeyFrame });
            restFrame.close();
            checkEncoderError();

            totalFrames++;
          }
        }

        // Add countdown beeps for rest between exercises
        if (includeCountdownBeeps && countdownBeeps) {
          const { countdownBeep, startBeep, countdownSeconds } = countdownBeeps;
          const restEndTime = restStartTime + restDuration;
          for (let i = countdownSeconds; i >= 1; i--) {
            const beepTime = restEndTime - i;
            if (beepTime >= restStartTime) {
              audioSources.push({
                buffer: countdownBeep,
                startTime: beepTime,
                volume: 0.6,
              });
            }
          }
          audioSources.push({
            buffer: startBeep,
            startTime: restEndTime,
            volume: 0.7,
          });
        }

        currentTimestamp += Math.round(restDuration * 1_000_000);
        currentTimeSeconds += restDuration;
      }

      reportProgress(STAGES.PROCESSING, {
        message: `Completed: ${exercise.exerciseName}`,
        exerciseIndex: exIndex + 1,
        totalExercises: exercises.length,
        progress: totalFrames / estimatedTotalFrames,
      });
    }

    checkAborted();

    reportProgress(STAGES.ENCODING, { message: 'Finalizing video...', progress: 0.8 });

    await encoder.flush();

    // Encode audio if needed
    if (includeAudio && audioSources.length > 0 && isAudioEncodingSupported()) {
      reportProgress(STAGES.ENCODING, { message: 'Processing audio...', progress: 0.85 });

      try {
        // Mix all audio sources
        const mixedAudio = await mixAudioBuffers(audioSources, totalDuration, sampleRate, numberOfChannels);

        // Create audio encoder
        const audioEncoder = await createAudioEncoder({
          sampleRate,
          numberOfChannels,
          bitrate: 128000,
          onChunk: (chunk, metadata) => {
            muxer.addAudioChunk(chunk, metadata);
          },
          onError: (error) => {
            console.warn('[ExportPipeline] Audio encoding error:', error);
          },
        });

        if (audioEncoder) {
          cleanupResources.push(() => audioEncoder.close());

          // Encode audio in chunks
          const samplesPerChunk = 1024;
          const totalSamples = mixedAudio.length;

          for (let offset = 0; offset < totalSamples; offset += samplesPerChunk) {
            checkAborted();

            const chunkSamples = Math.min(samplesPerChunk, totalSamples - offset);
            const timestamp = Math.round((offset / sampleRate) * 1_000_000);

            // Create interleaved data buffer for AudioData
            const dataBuffer = new Float32Array(chunkSamples * numberOfChannels);
            for (let ch = 0; ch < numberOfChannels; ch++) {
              const channelData = mixedAudio.getChannelData(ch);
              for (let i = 0; i < chunkSamples; i++) {
                dataBuffer[ch * chunkSamples + i] = channelData[offset + i] || 0;
              }
            }

            const audioData = new AudioData({
              format: 'f32-planar',
              sampleRate,
              numberOfFrames: chunkSamples,
              numberOfChannels,
              timestamp,
              data: dataBuffer,
            });

            audioEncoder.encode(audioData);
            audioData.close();
          }

          await audioEncoder.flush();
        }
      } catch (audioError) {
        console.warn('[ExportPipeline] Audio processing failed, continuing without audio:', audioError);
      }
    }

    reportProgress(STAGES.ENCODING, { message: 'Creating file...', progress: 0.95 });

    const blob = muxer.finalize();

    reportProgress(STAGES.COMPLETE, { message: 'Export complete!' });

    return blob;

  } catch (error) {
    if (error.message === 'Export cancelled') {
      reportProgress(STAGES.ERROR, { message: 'Export cancelled' });
    } else {
      console.error('[ExportPipeline] Error:', error);
      reportProgress(STAGES.ERROR, { message: error.message });
    }
    throw error;

  } finally {
    for (const cleanup of cleanupResources) {
      try {
        cleanup();
      } catch (e) {
        console.warn('[ExportPipeline] Cleanup error:', e);
      }
    }
  }
}

export default {
  STAGES,
  RESOLUTIONS,
  FRAME_RATES,
  calculateTotalDuration,
  exportWorkout,
};
