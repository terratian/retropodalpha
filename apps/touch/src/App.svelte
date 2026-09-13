<script>
  import { onMount } from 'svelte';
  import { initAudioEngine, playClickSound } from '@retropod/core/src/audioEngine.js';
  import { scanDirectoryZeroCopy } from '@retropod/core/src/fileSystemStore.js';
  import { fetchAudiophileMetadata } from '@retropod/core/src/metadataService.js';
  import NebulaVisualizer from '@retropod/visualizers/src/NebulaVisualizer.svelte';

  let audioElement;
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;
  let activeApp = 'home'; // home, player, visualizer
  let metadataInfo = null;

  onMount(() => {
    if (audioElement) initAudioEngine(audioElement);
  });

  async function handleOpenDirectory() {
    try {
      const dirHandle = await window.showDirectoryPicker();
      tracks = await scanDirectoryZeroCopy(dirHandle, 'audio', [], (msg) => console.log(msg));
      if (tracks.length > 0) {
        currentIndex = 0;
        loadTrack(currentIndex);
      }
    } catch (e) {
      console.warn('Directory error:', e);
    }
  }

  async function loadTrack(index) {
    if (!tracks[index]) return;
    currentIndex = index;
    const track = tracks[index];
    audioElement.src = track.url;
    audioElement.load();
    isPlaying = true;
    audioElement.play().catch(() => { isPlaying = false; });
    playClickSound();

    metadataInfo = await fetchAudiophileMetadata(track.artist, track.album, track.title);
  }

  function togglePlay() {
    playClickSound();
    if (!audioElement.src && tracks.length > 0) {
      loadTrack(0);
      return;
    }
    if (isPlaying) {
      audioElement.pause();
      isPlaying = false;
    } else {
      audioElement.play();
      isPlaying = true;
    }
  }

  function openApp(appName) {
    playClickSound();
    if (appName === 'library' && tracks.length === 0) {
      handleOpenDirectory();
    } else {
      activeApp = appName;
    }
  }
</script>

<audio bind:this={audioElement} on:ended={() => { if(tracks.length > 0) loadTrack((currentIndex + 1) % tracks.length); }}></audio>

{#if activeApp === 'visualizer'}
  <div class="top-nav-bar">
    <button on:click={() => activeApp = 'home'}>‹ Home</button>
    <span>Nebula Quantum Light Show</span>
  </div>
  <NebulaVisualizer {isPlaying} currentTrack={tracks[currentIndex]} visualizerMode={2} />
{:else if activeApp === 'player'}
  <div class="ios-lock-screen">
    <button class="back-home-btn" on:click={() => activeApp = 'home'}>‹ SpringBoard</button>
    <div class="ios-player-card">
      <div class="ios-art">
        {#if tracks[currentIndex]?.artUrl}
          <img src={tracks[currentIndex].artUrl} alt="Album Art" />
        {:else}
          <div class="no-artwork">♪</div>
        {/if}
      </div>
      <h2 class="ios-title">{tracks[currentIndex]?.title || 'No Track Loaded'}</h2>
      <p class="ios-artist">{tracks[currentIndex]?.artist || 'Select Music Directory'}</p>
      
      {#if metadataInfo}
        <div class="ios-liner-notes">
          <p><strong>Credits:</strong> {metadataInfo.trackFacts}</p>
          <p><strong>Pressing:</strong> {metadataInfo.albumFacts}</p>
          <p><strong>DAC:</strong> {metadataInfo.signalChain}</p>
        </div>
      {/if}

      <div class="ios-controls">
        <button on:click={() => { playClickSound(); if(tracks.length) loadTrack((currentIndex - 1 + tracks.length) % tracks.length); }}>⏮</button>
        <button class="play-big" on:click={togglePlay}>{isPlaying ? '❚❚' : '▶'}</button>
        <button on:click={() => { playClickSound(); if(tracks.length) loadTrack((currentIndex + 1) % tracks.length); }}>⏭</button>
      </div>
    </div>
  </div>
{:else}
  <div class="springboard">
    <div class="status-bar-ios">
      <span>1:12 AM</span>
      <span>5G Wi-Fi 🔋</span>
    </div>
    
    <div class="app-grid">
      <div class="app-icon" on:click={() => openApp('player')}>
        <div class="icon-inner music-icon">🎵</div>
        <span>RetroMusic</span>
      </div>
      <div class="app-icon" on:click={() => openApp('visualizer')}>
        <div class="icon-inner nebula-icon">✨</div>
        <span>Nebula</span>
      </div>
      <div class="app-icon" on:click={handleOpenDirectory}>
        <div class="icon-inner folder-icon">📁</div>
        <span>Files</span>
      </div>
    </div>

    <div class="ios-dock">
      <div class="app-icon" on:click={() => openApp('player')}>
        <div class="icon-inner music-icon">🎵</div>
      </div>
      <div class="app-icon" on:click={() => openApp('visualizer')}>
        <div class="icon-inner nebula-icon">✨</div>
      </div>
    </div>
  </div>
{/if}

<style>
  body { background: #000; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; overflow: hidden; }
  .springboard { width: 100vw; height: 100vh; background: linear-gradient(135deg, #1e1b4b 0%, #31103f 50%, #0f172a 100%); display: flex; flex-direction: column; justify-content: space-between; padding: 20px; box-sizing: border-box; }
  .status-bar-ios { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; padding: 0 10px; opacity: 0.9; }
  .app-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 30px 10px; align-content: start; }
  .app-icon { display: flex; flex-direction: column; align-items: center; cursor: pointer; text-align: center; font-size: 12px; gap: 6px; }
  .icon-inner { width: 64px; height: 64px; border-radius: 16px; display: flex; justify-content: center; align-items: center; font-size: 28px; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
  .music-icon { background: linear-gradient(135deg, #f43f5e, #fb7185); }
  .nebula-icon { background: linear-gradient(135deg, #3b82f6, #06b6d4); }
  .folder-icon { background: linear-gradient(135deg, #eab308, #f59e0b); }
  .ios-dock { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(20px); border-radius: 30px; padding: 12px 20px; display: flex; justify-content: space-around; align-items: center; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.2); }
  .ios-lock-screen { width: 100vw; height: 100vh; background: #090d16; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
  .back-home-btn { position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.1); border: none; color: #38bdf8; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; backdrop-filter: blur(10px); }
  .ios-player-card { width: 340px; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(25px); border-radius: 28px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
  .ios-art { width: 180px; height: 180px; border-radius: 16px; background: #334155; overflow: hidden; display: flex; justify-content: center; align-items: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .ios-art img { width: 100%; height: 100%; object-fit: cover; }
  .no-artwork { font-size: 64px; color: #64748b; }
  .ios-title { font-size: 18px; font-weight: bold; margin: 0 0 4px 0; text-align: center; }
  .ios-artist { font-size: 14px; color: #94a3b8; margin: 0 0 12px 0; text-align: center; }
  .ios-liner-notes { background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 10px; font-size: 11px; color: #cbd5e1; width: 100%; box-sizing: border-box; margin-bottom: 16px; max-height: 90px; overflow-y: auto; text-align: left; }
  .ios-controls { display: flex; gap: 30px; align-items: center; }
  .ios-controls button { background: none; border: none; font-size: 28px; color: #fff; cursor: pointer; }
  .play-big { font-size: 36px !important; color: #38bdf8 !important; }
  .top-nav-bar { position: fixed; top: 15px; left: 20px; z-index: 20; display: flex; gap: 15px; align-items: center; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); font-weight: bold; font-size: 13px; }
  .top-nav-bar button { background: none; border: none; color: #38bdf8; cursor: pointer; font-size: 14px; font-weight: bold; padding: 0; }
</style>
