<script>
  import { onMount } from 'svelte';
  import { initAudioEngine, playClickSound, setEqPreset } from '@retropod/core/src/audioEngine.js';
  import { scanDirectoryZeroCopy } from '@retropod/core/src/fileSystemStore.js';
  import NebulaVisualizer from '@retropod/core/src/NebulaVisualizer.svelte';

  let audioElement;
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;
  let activeApp = 'home';
  let currentEq = 'Flat';
  let visualizerMode = 0;
  let metadataMap = {};

  const eqPresets = ['Flat', 'Rock', 'Bass Booster', 'Acoustic', 'Classical'];

  onMount(() => {
    if (audioElement) initAudioEngine(audioElement);
  });

  async function handleOpenDirectory() {
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
    fetchMetadata(tracks[i]);
  }

  async function fetchMetadata(track) {
    try {
      const res = await fetch(`/api/metadata?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`);
      const data = await res.json();
      metadataMap[track.title] = {
        lyrics: data.lyrics || 'Genius lyrics indexed.',
        annotation: data.annotationSummary || 'Genius annotations active.',
        artUrl: data.songArt || track.artUrl
      };
      if (data.songArt && !track.artUrl) {
        track.artUrl = data.songArt;
        tracks = [...tracks];
      }
    } catch (e) {
      metadataMap[track.title] = { lyrics: 'Fallback lyrics', annotation: 'Offline mode' };
    }
  }

  function togglePlay() {
    playClickSound();
    if (!audioElement.src && tracks.length) { loadTrack(0); return; }
    if (isPlaying) { audioElement.pause(); isPlaying = false; }
    else { audioElement.play(); isPlaying = true; }
  }

  function openApp(id) {
    playClickSound();
    activeApp = id;
  }
</script>

<audio bind:this={audioElement} on:ended={() => { if(tracks.length) loadTrack((currentIndex + 1) % tracks.length); }}></audio>

<div class="pod-container">
  <div class="pod-chassis">
    <div class="ios-status-bar">
      <span>9:41 AM</span>
      {#if activeApp !== 'home'}
        <button class="back-home-btn" on:click={() => activeApp = 'home'}>‹ Home</button>
      {/if}
      <span>🔋 100%</span>
    </div>

    <div class="ios-screen">
      {#if activeApp === 'home'}
        <div class="springboard-grid">
          <div class="app-tile" role="button" tabindex="0" on:click={() => openApp('player')} on:keydown={(e) => e.key === 'Enter' && openApp('player')}>
            <div class="tile-icon music-bg">🎵</div>
            <span>Now Playing</span>
          </div>
          <div class="app-tile" role="button" tabindex="0" on:click={() => openApp('coverflow')} on:keydown={(e) => e.key === 'Enter' && openApp('coverflow')}>
            <div class="tile-icon cover-bg">💿</div>
            <span>3D CoverFlow</span>
          </div>
          <div class="app-tile" role="button" tabindex="0" on:click={() => openApp('eq')} on:keydown={(e) => e.key === 'Enter' && openApp('eq')}>
            <div class="tile-icon eq-bg">🎚️</div>
            <span>Wolfson EQ</span>
          </div>
          <div class="app-tile" role="button" tabindex="0" on:click={() => openApp('lyrics')} on:keydown={(e) => e.key === 'Enter' && openApp('lyrics')}>
            <div class="tile-icon lyrics-bg">📜</div>
            <span>Liner Notes</span>
          </div>
          <div class="app-tile" role="button" tabindex="0" on:click={() => openApp('visualizer')} on:keydown={(e) => e.key === 'Enter' && openApp('visualizer')}>
            <div class="tile-icon visualizer-bg">✨</div>
            <span>Nebula Visuals</span>
          </div>
          <div class="app-tile" role="button" tabindex="0" on:click={() => openApp('playlists')} on:keydown={(e) => e.key === 'Enter' && openApp('playlists')}>
            <div class="tile-icon playlist-bg">📑</div>
            <span>Playlists</span>
          </div>
          <div class="app-tile" role="button" tabindex="0" on:click={handleOpenDirectory} on:keydown={(e) => e.key === 'Enter' && handleOpenDirectory()}>
            <div class="tile-icon files-bg">📁</div>
            <span>Mount Files</span>
          </div>
        </div>

        <div class="ios-dock">
          <div class="app-tile" role="button" tabindex="0" on:click={() => openApp('player')} on:keydown={(e) => e.key === 'Enter' && openApp('player')}>
            <div class="tile-icon music-bg dock-icon">🎵</div>
          </div>
          <div class="app-tile" role="button" tabindex="0" on:click={() => openApp('coverflow')} on:keydown={(e) => e.key === 'Enter' && openApp('coverflow')}>
            <div class="tile-icon cover-bg dock-icon">💿</div>
          </div>
          <div class="app-tile" role="button" tabindex="0" on:click={() => openApp('visualizer')} on:keydown={(e) => e.key === 'Enter' && openApp('visualizer')}>
            <div class="tile-icon visualizer-bg dock-icon">✨</div>
          </div>
        </div>

      {:else if activeApp === 'player'}
        <div class="app-inner">
          <div class="glass-art">
            {#if tracks[currentIndex]?.artUrl}<img src={tracks[currentIndex].artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
          </div>
          <div class="meta">
            <h2>{tracks[currentIndex]?.title || 'No Track Loaded'}</h2>
            <p>{tracks[currentIndex]?.artist || 'Mount Files from Home'}</p>
          </div>
          <div class="controls">
            <button on:click={() => { if(tracks.length) loadTrack((currentIndex - 1 + tracks.length) % tracks.length); }}>⏮</button>
            <button class="big-play" on:click={togglePlay}>{isPlaying ? '❚❚' : '▶'}</button>
            <button on:click={() => { if(tracks.length) loadTrack((currentIndex + 1) % tracks.length); }}>⏭</button>
          </div>
        </div>

      {:else if activeApp === 'coverflow'}
        <div class="app-inner">
          <h3>3D Cover Flow</h3>
          <div class="coverflow-stage">
            {#each tracks as t, i}
              <div class="cf-card {i === currentIndex ? 'cf-active' : ''}" role="button" tabindex="0" style="transform: translateX({(i - currentIndex) * 60}px) scale({i === currentIndex ? 1 : 0.85}); z-index: {i === currentIndex ? 10 : 5 - Math.abs(i - currentIndex)};" on:click={() => loadTrack(i)} on:keydown={(e) => e.key === 'Enter' && loadTrack(i)}>
                {#if t.artUrl}<img src={t.artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
              </div>
            {/each}
          </div>
          <p class="cf-title">{tracks[currentIndex]?.title || 'Select Track'}</p>
        </div>

      {:else if activeApp === 'eq'}
        <div class="app-inner">
          <h3>Wolfson Parametric EQ</h3>
          <div class="eq-list">
            {#each eqPresets as preset}
              <button class="eq-btn {currentEq === preset ? 'active-eq' : ''}" on:click={() => { currentEq = preset; setEqPreset(preset); playClickSound(); }}>{preset}</button>
            {/each}
          </div>
        </div>

      {:else if activeApp === 'lyrics'}
        <div class="app-inner scrollable">
          <h3>Genius Verified Lyrics</h3>
          <pre>{metadataMap[tracks[currentIndex]?.title]?.lyrics || 'Select track to view lyrics...'}</pre>
        </div>

      {:else if activeApp === 'visualizer'}
        <div class="app-inner">
          <button class="eq-btn" on:click={() => visualizerMode = (visualizerMode + 1) % 3}>Mode: {visualizerMode}</button>
          <NebulaVisualizer {isPlaying} currentTrack={tracks[currentIndex]} {visualizerMode} />
        </div>

      {:else if activeApp === 'playlists'}
        <div class="app-inner">
          <h3>Playlists</h3>
          <button class="eq-btn" on:click={handleOpenDirectory}>Mount Local Library</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  body { background: #0b0f19; margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
  .pod-container { display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; }
  .pod-chassis { width: 360px; height: 680px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 44px; box-shadow: 0 35px 70px rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; padding: 16px; box-sizing: border-box; border: 3px solid #334155; }
  .ios-status-bar { width: 100%; height: 32px; display: flex; justify-content: space-between; align-items: center; padding: 0 12px; font-size: 11px; font-weight: bold; color: #94a3b8; }
  .back-home-btn { background: rgba(255,255,255,0.15); border: none; color: #38bdf8; padding: 2px 8px; border-radius: 10px; cursor: pointer; font-size: 10px; font-weight: bold; }
  .ios-screen { width: 100%; flex: 1; background: linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%); border-radius: 24px; border: 2px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: space-between; padding: 16px; box-sizing: border-box; overflow: hidden; position: relative; }
  .springboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .app-tile { display: flex; flex-direction: column; align-items: center; cursor: pointer; gap: 4px; font-size: 10px; font-weight: 500; }
  .tile-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 22px; box-shadow: 0 6px 15px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); }
  .music-bg { background: linear-gradient(135deg, #f43f5e, #be123c); }
  .cover-bg { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
  .eq-bg { background: linear-gradient(135deg, #06b6d4, #0e7490); }
  .lyrics-bg { background: linear-gradient(135deg, #10b981, #047857); }
  .visualizer-bg { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .playlist-bg { background: linear-gradient(135deg, #6366f1, #4338ca); }
  .files-bg { background: linear-gradient(135deg, #14b8a6, #0f766e); }
  .ios-dock { background: rgba(255,255,255,0.1); backdrop-filter: blur(20px); border-radius: 20px; padding: 8px; display: flex; justify-content: space-around; width: 100%; border: 1px solid rgba(255,255,255,0.2); }
  .dock-icon { width: 40px; height: 40px; font-size: 18px; }
  .app-inner { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 12px; }
  .scrollable { overflow-y: auto; align-items: stretch; text-align: left; }
  .glass-art { width: 130px; height: 130px; border-radius: 14px; background: rgba(0,0,0,0.5); overflow: hidden; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(255,255,255,0.2); }
  .玻璃 art img, .glass-art img { width: 100%; height: 100%; object-fit: cover; }
  .no-art { font-size: 36px; color: #64748b; }
  .meta h2 { font-size: 14px; margin: 0 0 2px 0; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .meta p { font-size: 11px; color: #94a3b8; margin: 0; }
  .controls { display: flex; gap: 20px; align-items: center; }
  .controls button { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; }
  .big-play { font-size: 28px !important; color: #38bdf8 !important; }
  .coverflow-stage { position: relative; width: 100%; height: 120px; display: flex; justify-content: center; align-items: center; }
  .cf-card { position: absolute; width: 90px; height: 90px; background: #334155; border-radius: 8px; overflow: hidden; display: flex; justify-content: center; align-items: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); transition: transform 0.3s; }
  .cf-active { border: 2px solid #38bdf8; }
  .cf-card img { width: 100%; height: 100%; object-fit: cover; }
  .cf-title { font-size: 11px; font-weight: bold; color: #cbd5e1; margin-top: 8px; }
  .eq-list { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 180px; }
  .eq-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px; border-radius: 8px; font-weight: bold; cursor: pointer; }
  .active-eq { background: #38bdf8 !important; color: #0f172a !important; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 11px; color: #cbd5e1; }
</style>
