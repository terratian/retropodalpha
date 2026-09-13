<script>
  import { playClickSound } from '@retropod/core/src/audioEngine.js';

  export let onSelectMode;

  function selectMode(mode) {
    playClickSound();
    if (onSelectMode) onSelectMode(mode);
    else window.location.href = `/${mode}/index.html`;
  }
</script>

<div class="boot-selector">
  <div class="boot-card">
    <h1>RetroPod Alpha</h1>
    <p class="subtitle">Select Your Hardware Experience</p>
    
    <div class="mode-options">
      <div class="mode-tile classic-tile" on:click={() => selectMode('classic')}>
        <div class="tile-icon">🎛️</div>
        <h2>RetroPod Classic</h2>
        <p>5th Generation Click Wheel, Wolfson DAC DSP, and physical chassis rendering.</p>
      </div>

      <div class="mode-tile touch-tile" on:click={() => selectMode('touch')}>
        <div class="tile-icon">📱</div>
        <h2>RetroPod Touch</h2>
        <p>iOS 13 SpringBoard layout, frosted glass dock, and immersive audio-reactive visuals.</p>
      </div>
    </div>
  </div>
</div>

<style>
  body { background: #04060f; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
  .boot-selector { display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; background: radial-gradient(circle at center, #1e1b4b 0%, #04060f 100%); }
  .boot-card { text-align: center; max-width: 700px; padding: 40px; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(25px); border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
  h1 { font-size: 32px; margin: 0 0 8px 0; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 30px; }
  .mode-options { display: flex; gap: 24px; justify-content: center; }
  .mode-tile { flex: 1; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; cursor: pointer; transition: all 0.3s ease; text-align: left; display: flex; flex-direction: column; gap: 10px; }
  .mode-tile:hover { transform: translateY(-4px); border-color: #38bdf8; background: rgba(30, 41, 59, 0.9); box-shadow: 0 10px 30px rgba(56, 189, 248, 0.2); }
  .tile-icon { font-size: 36px; margin-bottom: 4px; }
  .mode-tile h2 { font-size: 18px; margin: 0; color: #f8fafc; }
  .mode-tile p { font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.4; }
</style>
