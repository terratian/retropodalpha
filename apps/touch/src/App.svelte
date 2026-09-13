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
  let activeApp = 'home';
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

<div class="device-stage">
  <div class="device-bezel">
    <div class="speaker-slit"></div>
    <div class="camera-dot"></div>
    
    <div class="ios-screen">
      {#if activeApp === 'visualizer'}
        <div class="ios-status-bar">
          <span>1:12 AM</span>
          <button class="status-back" on:click={() => activeApp = 'home'}>‹ SpringBoard</button>
          <span>5G 🔋</span>
        </div>
        <NebulaVisualizer {isPlaying} currentTrack={tracks[currentIndex]} visualizerMode={2} />
      {:else if activeApp === 'player'}
        <div class="ios-status-bar">
          <span>1:12 AM</span>
          <button class="status-back" on:click={() => activeApp = 'home'}>‹ SpringBoard</button>
          <span>5G 🔋</span>
        </div>
        <div class="ios-player-view">
          <div class="album-art-container">
            {#if tracks[currentIndex]?.artUrl}
              <img src={tracks[currentIndex].artUrl} alt="Album Art" />
            {:else}
              <div class="no-art-glyph">🎵</div>
            {/if}
            <div class="glass-reflection"></div>
          </div>
          
          <div class="track-info-card">
            <h2>{tracks[currentIndex]?.title || 'No Track Loaded'}</h2>
            <p class="artist-sub">{tracks[currentIndex]?.artist || 'Tap Files to mount music library'}</p>
            
            {#if metadataInfo}
              <div class="audiophile-badge">
                <p><strong>Credits:</strong> {metadataInfo.trackFacts}</p>
                <p><strong>Pressing:</strong> {metadataInfo.albumFacts}</p>
                <p><strong>DAC:</strong> {metadataInfo.signalChain}</p>
              </div>
            {/if}
          </div>

          <div class="ios-control-bar">
            <button on:click={() => { playClickSound(); if(tracks.length) loadTrack((currentIndex - 1 + tracks.length) % tracks.length); }}>⏮</button>
            <button class="play-btn-round" on:click={togglePlay}>{isPlaying ? '❚❚' : '▶'}</button>
            <button on:click={() => { playClickSound(); if(tracks.length) loadTrack((currentIndex + 1) % tracks.length); }}>⏭</button>
          </div>
        </div>
      {:else}
        <div class="ios-status-bar">
          <span>1:12 AM</span>
          <span>5G Wi-Fi 🔋</span>
        </div>

        <div class="springboard-grid">
          <div class="icon-wrapper" on:click={() => openApp('player')}>
            <div class="ios-icon music-app-icon">
              <span class="icon-glyph">🎵</span>
              <div class="icon-gloss"></div>
            </div>
            <span class="icon-label">RetroMusic</span>
          </div>

          <div class="icon-wrapper" on:click={() => openApp('visualizer')}>
            <div class="ios-icon nebula-app-icon">
              <span class="icon-glyph">✨</span>
              <div class="icon-gloss"></div>
            </div>
            <span class="icon-label">Nebula</span>
          </div>

          <div class="icon-wrapper" on:click={handleOpenDirectory}>
            <div class="ios-icon files-app-icon">
              <span class="icon-glyph">📁</span>
              <div class="icon-gloss"></div>
            </div>
            <span class="icon-label">Files</span>
          </div>
        </div>

        <div class="ios-glass-dock">
          <div class="icon-wrapper" on:click={() => openApp('player')}>
            <div class="ios-icon music-app-icon dock-icon">
              <span class="icon-glyph">🎵</span>
              <div class="icon-gloss"></div>
            </div>
          </div>
          <div class="icon-wrapper" on:click={() => openApp('visualizer')}>
            <div class="ios-icon nebula-app-icon dock-icon">
              <span class="icon-glyph">✨</span>
              <div class="icon-gloss"></div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="home-indicator"></div>
  </div>
</div>

<style>
  :global(body) { margin: 0; padding: 0; background: #05070d; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif; color: #fff; overflow: hidden; }
  .device-stage { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%); }
  .device-bezel { width: 390px; height: 780px; background: linear-gradient(135deg, #27272a 0%, #09090b 100%); border-radius: 52px; padding: 18px; box-sizing: border-box; box-shadow: 0 40px 100px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.25); border: 3px solid #3f3f46; position: relative; display: flex; flex-direction: column; align-items: center; }
  .speaker-slit { width: 60px; height: 5px; background: #18181b; border-radius: 3px; margin-top: 4px; }
  .camera-dot { width: 10px; height: 10px; background: #121212; border-radius: 50%; position: absolute; top: 22px; left: 120px; border: 1px solid #27272a; }
  .ios-screen { width: 100%; height: 720px; background: linear-gradient(135deg, #31103f 0%, #1e1b4b 50%, #0f172a 100%); border-radius: 38px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; position: relative; margin-top: 10px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
  .ios-status-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); z-index: 20; }
  .status-back { background: rgba(255,255,255,0.15); border: none; color: #38bdf8; padding: 4px 10px; border-radius: 12px; cursor: pointer; font-size: 11px; font-weight: bold; backdrop-filter: blur(10px); }
  .springboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 24px 20px; align-content: start; z-index: 10; }
  .icon-wrapper { display: flex; flex-direction: column; align-items: center; cursor: pointer; gap: 6px; }
  .ios-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; justify-content: center; align-items: center; position: relative; overflow: hidden; box-shadow: 0 12px 25px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.6); transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .ios-icon:hover { transform: scale(1.08); }
  .music-app-icon { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); }
  .nebula-app-icon { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); }
  .files-app-icon { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
  .icon-glyph { font-size: 28px; z-index: 2; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
  .icon-gloss { position: absolute; top: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%); z-index: 1; pointer-events: none; }
  .icon-label { font-size: 11px; font-weight: 500; text-shadow: 0 1px 3px rgba(0,0,0,0.8); color: #f1f5f9; }
  .ios-glass-dock { background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(25px); border-radius: 28px; margin: 0 16px 16px 16px; padding: 12px 20px; display: flex; justify-content: space-around; align-items: center; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
  .dock-icon { width: 54px; height: 54px; border-radius: 14px; }
  .home-indicator { width: 130px; height: 4px; background: rgba(255,255,255,0.5); border-radius: 2px; position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); }
  .ios-player-view { display: flex; flex-direction: column; align-items: center; padding: 10px 20px 20px 20px; flex: 1; justify-content: space-between; }
  .album-art-container { width: 180px; height: 180px; border-radius: 20px; background: rgba(15, 23, 42, 0.8); overflow: hidden; display: flex; justify-content: center; align-items: center; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); }
  .album-art-container img { width: 100%; height: 100%; object-fit: cover; }
  .no-art-glyph { font-size: 56px; color: #64748b; }
  .glass-reflection { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%); pointer-events: none; }
  .track-info-card { width: 100%; text-align: center; }
  .track-info-card h2 { font-size: 16px; font-weight: 700; margin: 0 0 4px 0; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .artist-sub { font-size: 13px; color: #94a3b8; margin: 0 0 10px 0; }
  .audiophile-badge { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(10px); border-radius: 12px; padding: 8px 12px; font-size: 10px; color: #cbd5e1; text-align: left; border: 1px solid rgba(255,255,255,0.1); max-height: 70px; overflow-y: auto; }
  .ios-control-bar { display: flex; gap: 30px; align-items: center; margin-bottom: 10px; }
  .ios-control-bar button { background: none; border: none; font-size: 26px; color: #fff; cursor: pointer; transition: transform 0.1s; }
  .ios-control-bar button:active { transform: scale(0.9); }
  .play-btn-round { font-size: 34px !important; color: #38bdf8 !important; }
</style>
