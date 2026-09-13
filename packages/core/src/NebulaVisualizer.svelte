<script>
  export let isPlaying = false;
  export let currentTrack = null;
  export let visualizerMode = 0;
</script>

<div class="nebula-container mode-{visualizerMode}">
  <div class="nebula-glow" class:active={isPlaying}></div>
  <div class="nebula-info">
    <span>{currentTrack?.title || 'Visualizer Active'}</span>
  </div>
</div>

<style>
  .nebula-container { width: 100%; height: 100%; background: #000; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .nebula-glow { width: 60px; height: 60px; background: radial-gradient(circle, #38bdf8 0%, rgba(56,189,248,0) 70%); border-radius: 50%; transition: transform 0.5s ease; transform: scale(0.8); }
  .nebula-glow.active { transform: scale(1.6); animation: pulseGlow 2s infinite alternate; }
  @keyframes pulseGlow {
    0% { opacity: 0.6; filter: hue-rotate(0deg); }
    100% { opacity: 1; filter: hue-rotate(90deg); }
  }
  .nebula-info { position: absolute; bottom: 8px; font-size: 9px; color: #94a3b8; }
</style>
