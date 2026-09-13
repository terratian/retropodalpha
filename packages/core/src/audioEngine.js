let audioCtx = null;
let sourceNode = null;
let analyserNode = null;
let masterGainNode = null;

export async function initAudioEngine(audioElement) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    if (!sourceNode && audioElement) {
      sourceNode = audioCtx.createMediaElementSource(audioElement);
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;
      masterGainNode = audioCtx.createGain();

      sourceNode.connect(masterGainNode);
      masterGainNode.connect(analyserNode);
      analyserNode.connect(audioCtx.destination);
    }
  } catch (e) {
    console.warn('Web Audio initialization note:', e);
  }
}

export function getAudioSpectrum(dataArray) {
  if (!analyserNode) return false;
  analyserNode.getByteFrequencyData(dataArray);
  return true;
}

export function playClickSound() {
  try {
    const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    // Audio restricted before user gesture
  }
}
