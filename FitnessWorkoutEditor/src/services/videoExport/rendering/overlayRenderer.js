/**
 * Overlay Renderer
 * Renders exercise information overlay on video frames
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
 * Create an overlay renderer
 * @param {number} width - Output width
 * @param {number} height - Output height
 * @returns {Object} Overlay renderer
 */
export function createOverlayRenderer(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  const fonts = getFontSizes(height);

  return {
    renderExerciseOverlay(options, translations) {
      const {
        exerciseName,
        currentRep,
        totalReps,
        currentSet,
        totalSets,
        remainingSeconds,
        exerciseType,
        contentArea,
      } = options;

      const t = translations?.t || ((key) => key);

      ctx.clearRect(0, 0, width, height);

      const area = contentArea || { x: 0, y: 0, width, height };

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      const topBarHeight = area.height * 0.12;
      ctx.fillRect(area.x, area.y, area.width, topBarHeight);

      ctx.fillStyle = COLORS.text;
      ctx.font = `bold ${fonts.nextName}px Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(exerciseName, area.x + area.width * 0.03, area.y + topBarHeight / 2);

      ctx.textAlign = 'right';
      ctx.font = `bold ${fonts.nextLabel}px Arial, sans-serif`;
      const setText = t('overlay.set')
        .replace('{current}', currentSet)
        .replace('{total}', totalSets);
      ctx.fillText(setText, area.x + area.width * 0.97, area.y + topBarHeight / 2);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      const bottomBarHeight = area.height * 0.1;
      ctx.fillRect(area.x, area.y + area.height - bottomBarHeight, area.width, bottomBarHeight);

      ctx.fillStyle = COLORS.highlight;
      ctx.font = `bold ${fonts.countdown * 0.4}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (exerciseType === 'count') {
        const repText = t('overlay.rep')
          .replace('{current}', currentRep)
          .replace('{total}', totalReps);
        ctx.fillText(repText, area.x + area.width / 2, area.y + area.height - bottomBarHeight / 2);
      } else {
        const durationText = t('overlay.duration')
          .replace('{seconds}', remainingSeconds);
        ctx.fillText(durationText, area.x + area.width / 2, area.y + area.height - bottomBarHeight / 2);
      }

      return canvas;
    },

    get canvas() {
      return canvas;
    },

    clear() {
      ctx.clearRect(0, 0, width, height);
    },
  };
}

export default {
  createOverlayRenderer,
  COLORS,
  getFontSizes,
};
