<script>
  import { onMount } from 'svelte';
  import { initAudioEngine, playClickSound } from '@retropod/core/src/audioEngine.js';
  import { scanDirectoryZeroCopy } from '@retropod/core/src/fileSystemStore.js';

  let audioElement;
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;
  let volume = 0.8;
  let shuffleMode = false;

  onMount(() => {
    if (audioElement) initAudioEngine(audioElement);
  });

  async function mountFiles() {
    playClickSound();
    try {
      const handle = await window.showDirectoryPicker();
      tracks = await scanDirectoryZeroCopy(handle, 'audio', [], () => {});
      if (tracks.length > 0) loadTrack(0);
    } catch (e) {
      console.warn(e);
    }
  }

  function loadTrack(i) {
    currentIndex = i;
    audioElement.src = tracks[i].url;
    audioElement.load();
    audioElement.play();
    isPlaying = true;
    playClickSound();
  }

  function togglePlay() {
    playClickSound();
    if (!audioElement.src && tracks.length) { loadTrack(0); return; }
    if (isPlaying) { audioElement.pause(); isPlaying = false; }
    else { audioElement.play(); isPlaying = true; }
  }

  function skip(dir) {
    playClickSound();
    if (!tracks.length) return;
    let next = shuffleMode ? Math.floor(Math.random() * tracks.length) : (currentIndex + dir + tracks.length) % tracks.length;
    loadTrack(next);
  }
</script>

<audio bind:this={audioElement} on:ended={() => skip(1)}></audio>

<div class="shuffle-chassis">
  <div class="clip-bracket"></div>
  <div class="shuffle-face">
    <div class="status-led {isPlaying ? 'led-green' : 'led-orange'}"></div>
    <div class="control-pad">
      <div class="pad-up" role="button" tabindex="0" on:click={() => { volume = Math.min(1, volume + 0.1); if(audioElement) audioElement.volume = volume; playClickSound(); }} on:keydown={(e) => e.key === 'Enter' && (volume = Math.min(1, volume + 0.1))}></div>
      <div class="pad-down" role="button" tabindex="0" on:click={() => { volume = Math.max(0, volume - 0.1); if(audioElement) audioElement.volume = volume; playClickSound(); }} on:keydown={(e) => e.key === 'Enter' && (volume = Math.max(0, volume - 0.1))}></div>
      <div class="pad-left" role="button" tabindex="0" on:click={() => skip(-1)} on:keydown={(e) => e.key === 'Enter' && skip(-1)}></div>
      <div class="pad-right" role="button" tabindex="0" on:click={() => skip(1)} on:keydown={(e) => e.key === 'Enter' && skip(1)}></div>
      <div class="pad-center" role="button" tabindex="0" on:click={togglePlay} on:keydown={(e) => e.key === 'Enter' && togglePlay()}></div>
    </div>
    <div class="shuffle-toggle-switch">
      <button class="sw-btn {!shuffleMode ? 'active' : ''}" on:click={() => shuffleMode = false}>seq</button>
      <button class="sw-btn {shuffleMode ? 'active' : ''}" on:click={() => shuffleMode = true}>shuf</button>
    </div>
    <button class="mount-shuffle-btn" on:click={mountFiles}>📂 {tracks.length ? tracks[currentIndex].title : 'Mount Files'}</button>
  </div>
</div>

<style>
  :global(body) { margin: 0; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #fff; overflow: hidden; height: 100vh; display: flex; justify-content: center; align-items: center; }
  .shuffle-chassis { width: 220px; height: 320px; background: linear-gradient(135deg, #cbd5e1 0%, #64748b 100%); border-radius: 36px; padding: 20px; box-sizing: border-box; box-shadow: 0 30px 60px rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; position: relative; border: 2px solid #94a3b8; }
  .clip-bracket { position: absolute; top: -15px; width: 80px; height: 20px; background: #475569; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.4); }
  .shuffle-face { width: 100%; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; position: relative; }
  .status-led { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 6px currentColor; }
  .led-green { background: #22c55e; color: #22c55e; }
  .led-orange { background: #f97316; color: #f97316; }
  .control-pad { width: 130px; height: 130px; background: #f1f5f9; border-radius: 50%; position: relative; box-shadow: inset 0 3px 6px rgba(0,0,0,0.2), 0 8px 20px rgba(0,0,0,0.3); border: 1px solid #cbd5e1; cursor: pointer; }
  .pad-center { position: absolute; top: 35px; left: 35px; width: 60px; height: 60px; background: #e2e8f0; border-radius: 50%; border: 1px solid #cbd5e1; }
  .pad-up { position: absolute; top: 5px; left: 50%; transform: translateX(-50%); width: 30px; height: 20px; }
  .pad-down { position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); width: 30px; height: 20px; }
  .pad-left { position: absolute; left: 5px; top: 50%; transform: translateY(-50%); width: 20px; height: 30px; }
  .pad-right { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); width: 20px; height: 30px; }
  .shuffle-toggle-switch { display: flex; background: #334155; border-radius: 10px; padding: 2px; gap: 2px; }
  .sw-btn { background: transparent; border: none; color: #94a3b8; font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 8px; cursor: pointer; }
  .sw-btn.active { background: #38bdf8; color: #0f172a; }
  .mount-shuffle-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: #0f172a; font-size: 11px; font-weight: bold; padding: 6px 12px; border-radius: 8px; cursor: pointer; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
