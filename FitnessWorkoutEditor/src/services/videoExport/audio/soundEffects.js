/**
 * Sound Effects Generator
 * Generates countdown beeps using Web Audio API
 */

/**
 * Generate a beep sound
 * @param {Object} options - Beep options
 * @returns {AudioBuffer} Generated beep sound
 */
export async function generateBeep({
  frequency = 880,
  duration = 0.15,
  sampleRate = 44100,
  type = 'sine',
  volume = 0.5,
} = {}) {
  const audioContext = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);

  const oscillator = audioContext.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(volume, 0);
  gainNode.gain.exponentialRampToValueAtTime(0.01, duration - 0.01);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(0);
  oscillator.stop(duration);

  return await audioContext.startRendering();
}

/**
 * Generate countdown beeps for rest periods
 * @param {Object} options - Options
 * @returns {Promise<Object>} Object with beep sounds
 */
export async function generateCountdownBeeps({ countdownSeconds = 3, sampleRate = 44100 } = {}) {
  const countdownBeep = await generateBeep({
    frequency: 660,
    duration: 0.15,
    sampleRate,
    volume: 0.4,
  });

  const startBeep = await generateBeep({
    frequency: 880,
    duration: 0.25,
    sampleRate,
    volume: 0.5,
  });

  return {
    countdownBeep,
    startBeep,
    countdownSeconds,
  };
}

/**
 * Generate a double beep for exercise start
 */
export async function generateStartBeep({ sampleRate = 44100 } = {}) {
  const duration = 0.4;
  const audioContext = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);

  const osc1 = audioContext.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 880;
  const gain1 = audioContext.createGain();
  gain1.gain.setValueAtTime(0.5, 0);
  gain1.gain.exponentialRampToValueAtTime(0.01, 0.14);
  osc1.connect(gain1);
  gain1.connect(audioContext.destination);
  osc1.start(0);
  osc1.stop(0.15);

  const osc2 = audioContext.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 1100;
  const gain2 = audioContext.createGain();
  gain2.gain.setValueAtTime(0.5, 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.01, 0.34);
  osc2.connect(gain2);
  gain2.connect(audioContext.destination);
  osc2.start(0.2);
  osc2.stop(0.35);

  return await audioContext.startRendering();
}

/**
 * Generate silence
 */
export async function generateSilence(duration, sampleRate = 44100, numberOfChannels = 2) {
  const audioContext = new OfflineAudioContext(
    numberOfChannels,
    Math.ceil(duration * sampleRate),
    sampleRate
  );
  return await audioContext.startRendering();
}

/**
 * Schedule countdown beeps in an audio mixer
 */
export function scheduleCountdownBeeps(mixer, beeps, restEndTime, restDuration) {
  const { countdownBeep, startBeep, countdownSeconds } = beeps;

  for (let i = countdownSeconds; i >= 1; i--) {
    const beepTime = restEndTime - i;
    if (beepTime >= restEndTime - restDuration) {
      mixer.addSoundEffect(countdownBeep, beepTime, 0.6);
    }
  }

  mixer.addSoundEffect(startBeep, restEndTime, 0.7);
}

export default {
  generateBeep,
  generateCountdownBeeps,
  generateStartBeep,
  generateSilence,
  scheduleCountdownBeeps,
};
