let audioCtx = null;
let sourceNode = null;
let analyserNode = null;
let eqFilters = [];
let clickAudio = new Audio('https://actions.google.com/sounds/v1/ui/click.ogg');

export function initAudioEngine(audioElement) {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  
  sourceNode = audioCtx.createMediaElementSource(audioElement);
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 128;

  // Create 3-band parametric EQ (Low Shelf, Peaking, High Shelf)
  const bassFilter = audioCtx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.setValueAtTime(250, audioCtx.currentTime);

  const midFilter = audioCtx.createBiquadFilter();
  midFilter.type = 'peaking';
  midFilter.frequency.setValueAtTime(1500, audioCtx.currentTime);
  midFilter.Q.setValueAtTime(1, audioCtx.currentTime);

  const trebleFilter = audioCtx.createBiquadFilter();
  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.setValueAtTime(4000, audioCtx.currentTime);

  eqFilters = [bassFilter, midFilter, trebleFilter];

  // Chain: Source -> Bass -> Mid -> Treble -> Analyser -> Destination
  sourceNode.connect(bassFilter);
  bassFilter.connect(midFilter);
  midFilter.connect(trebleFilter);
  trebleFilter.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);
}

export function setEqPreset(presetName) {
  if (!audioCtx || eqFilters.length < 3) return;
  const [bass, mid, treble] = eqFilters;
  
  const presets = {
    'Flat': { bass: 0, mid: 0, treble: 0 },
    'Rock': { bass: 5, mid: -2, treble: 4 },
    'Bass Booster': { bass: 9, mid: 1, treble: 2 },
    'Acoustic': { bass: 2, mid: 4, treble: 3 },
    'Classical': { bass: 4, mid: 0, treble: 5 }
  };

  const p = presets[presetName] || presets['Flat'];
  bass.gain.setValueAtTime(p.bass, audioCtx.currentTime);
  mid.gain.setValueAtTime(p.mid, audioCtx.currentTime);
  treble.gain.setValueAtTime(p.treble, audioCtx.currentTime);
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function getAudioSpectrum(dataArray) {
  if (!analyserNode) return false;
  analyserNode.getByteFrequencyData(dataArray);
  return true;
}

export function playClickSound() {
  clickAudio.currentTime = 0;
  clickAudio.volume = 0.3;
  clickAudio.play().catch(() => {});
}
