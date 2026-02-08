/**
 * Rest Frame Renderer
 * Renders rest/countdown screens between sets and exercises
 */

const COLORS = {
  background: '#1a1a2e',
  primary: '#16213e',
  text: '#ffffff',
  highlight: '#e94560',
  secondary: '#a0a0a0',
};

function getFontSizes(height) {
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
 * Create a rest frame renderer
 * @param {number} width - Output width
 * @param {number} height - Output height
 * @returns {Object} Rest frame renderer
 */
export function createRestFrameRenderer(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  // Use the smaller dimension for font scaling to ensure text fits
  // For portrait videos (1080x1920), use width (1080) instead of height (1920)
  const scaleDimension = Math.min(width, height);
  const fonts = getFontSizes(scaleDimension);

  return {
    renderRestFrame(options, translations) {
      const {
        countdown,
        restType,
        nextExerciseName,
        nextExerciseDetails,
        currentSet,
        totalSets,
      } = options;

      const t = translations?.t || ((key) => key);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, COLORS.background);
      gradient.addColorStop(1, COLORS.primary);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = COLORS.secondary;
      ctx.font = `bold ${fonts.title}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const titleText = restType === 'betweenSets'
        ? t('rest.betweenSets')
        : t('rest.betweenExercises');
      ctx.fillText(titleText, width / 2, height * 0.167);

      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      ctx.fillStyle = COLORS.text;
      ctx.font = `bold ${fonts.countdown}px Arial, sans-serif`;
      ctx.fillText(timeText, width / 2, height / 2 - height * 0.042);

      if (restType === 'betweenSets' && currentSet && totalSets) {
        ctx.fillStyle = COLORS.secondary;
        ctx.font = `${fonts.setInfo}px Arial, sans-serif`;
        const setInfoText = t('rest.preparingSet')
          .replace('{current}', currentSet)
          .replace('{total}', totalSets);
        ctx.fillText(setInfoText, width / 2, height / 2 + height * 0.111);
      }

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

      return canvas;
    },

    get canvas() {
      return canvas;
    },
  };
}

/**
 * Format exercise details for display
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
  createRestFrameRenderer,
  formatExerciseDetails,
  COLORS,
  getFontSizes,
};
