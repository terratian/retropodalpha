<script>
  import { onMount } from 'svelte';
  import { initAudioEngine, playClickSound, setEqPreset } from '@retropod/core/src/audioEngine.js';
  import { scanDirectoryZeroCopy } from '@retropod/core/src/fileSystemStore.js';
  import { fetchAudiophileMetadata } from '@retropod/core/src/metadataService.js';
  import { savePlaylist, getAllPlaylists } from '@retropod/core/src/playlistStore.js';
  import NebulaVisualizer from '@retropod/visualizers/src/NebulaVisualizer.svelte';

  let audioElement;
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;
  let activeApp = 'home'; // home, player, coverflow, eq, lyrics, visualizer, playlists, files
  let metadataInfo = null;
  let currentEq = 'Flat';
  let visualizerMode = 0;
  let playlists = {};
  let playlistNameInput = '';

  const eqPresets = ['Flat', 'Rock', 'Bass Booster', 'Acoustic', 'Classical'];

  onMount(() => {
    if (audioElement) initAudioEngine(audioElement);
    playlists = getAllPlaylists();
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
    if (appName === 'files' && tracks.length === 0) {
      handleOpenDirectory();
    } else {
      activeApp = appName;
    }
  }

  function changeEq(preset) {
    playClickSound();
    currentEq = preset;
    setEqPreset(preset);
  }

  function saveCurrentPlaylist() {
    if (!playlistNameInput.trim() || tracks.length === 0) return;
    savePlaylist(playlistNameInput.trim(), tracks);
    playlists = getAllPlaylists();
    playlistNameInput = '';
    playClickSound();
  }
</script>

<audio bind:this={audioElement} on:ended={() => { if(tracks.length > 0) loadTrack((currentIndex + 1) % tracks.length); }}></audio>

<div class="ios-container">
  <div class="ios-status-bar">
    <span>1:42 AM</span>
    {#if activeApp !== 'home'}
      <button class="back-home-btn" on:click={() => activeApp = 'home'}>‹ SpringBoard</button>
    {/if}
    <span>5G Wi-Fi 🔋</span>
  </div>

  <div class="ios-viewport">
    {#if activeApp === 'home'}
      <div class="springboard-grid">
        <div class="app-tile" on:click={() => openApp('player')}>
          <div class="tile-icon music-bg">🎵</div>
          <span>Now Playing</span>
        </div>
        <div class="app-tile" on:click={() => openApp('coverflow')}>
          <div class="tile-icon cover-bg">💿</div>
          <span>3D CoverFlow</span>
        </div>
        <div class="app-tile" on:click={() => openApp('eq')}>
          <div class="tile-icon eq-bg">🎚️</div>
          <span>Wolfson EQ</span>
        </div>
        <div class="app-tile" on:click={() => openApp('lyrics')}>
          <div class="tile-icon lyrics-bg">📜</div>
          <span>Liner Notes</span>
        </div>
        <div class="app-tile" on:click={() => openApp('visualizer')}>
          <div class="tile-icon visualizer-bg">✨</div>
          <span>Nebula Visuals</span>
        </div>
        <div class="app-tile" on:click={() => openApp('playlists')}>
          <div class="tile-icon playlist-bg">📑</div>
          <span>Playlists</span>
        </div>
        <div class="app-tile" on:click={handleOpenDirectory}>
          <div class="tile-icon files-bg">📁</div>
          <span>Mount Files</span>
        </div>
      </div>

      <div class="ios-dock">
        <div class="app-tile" on:click={() => openApp('player')}>
          <div class="tile-icon music-bg dock-icon">🎵</div>
        </div>
        <div class="app-tile" on:click={() => openApp('coverflow')}>
          <div class="tile-icon cover-bg dock-icon">💿</div>
        </div>
        <div class="app-tile" on:click={() => openApp('visualizer')}>
          <div class="tile-icon visualizer-bg dock-icon">✨</div>
        </div>
      </div>

    {:else if activeApp === 'player'}
      <div class="app-inner-view">
        <div class="big-artwork">
          {#if tracks[currentIndex]?.artUrl}
            <img src={tracks[currentIndex].artUrl} alt="Art" />
          {:else}
            <div class="no-art">♪</div>
          {/if}
        </div>
        <h2>{tracks[currentIndex]?.title || 'No Track Loaded'}</h2>
        <p class="artist-sub">{tracks[currentIndex]?.artist || 'Mount Files to begin'}</p>
        
        <div class="playback-controls">
          <button on:click={() => { playClickSound(); if(tracks.length) loadTrack((currentIndex - 1 + tracks.length) % tracks.length); }}>⏮</button>
          <button class="play-big" on:click={togglePlay}>{isPlaying ? '❚❚' : '▶'}</button>
          <button on:click={() => { playClickSound(); if(tracks.length) loadTrack((currentIndex + 1) % tracks.length); }}>⏭</button>
        </div>
      </div>

    {:else if activeApp === 'coverflow'}
      <div class="app-inner-view">
        <h3 class="app-title">3D Cover Flow</h3>
        <div class="coverflow-stage">
          {#each tracks as t, i}
            <div class="cf-card {i === currentIndex ? 'cf-active' : ''}" style="transform: translateX({(i - currentIndex) * 60}px) scale({i === currentIndex ? 1 : 0.85}); z-index: {i === currentIndex ? 10 : 5 - Math.abs(i - currentIndex)};" on:click={() => loadTrack(i)}>
              {#if t.artUrl}<img src={t.artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
            </div>
          {/each}
        </div>
        <p class="cf-label">{tracks[currentIndex]?.title || 'Select track'}</p>
      </div>

    {:else if activeApp === 'eq'}
      <div class="app-inner-view">
        <h3 class="app-title">Wolfson Parametric EQ</h3>
        <div class="eq-preset-list">
          {#each eqPresets as preset}
            <button class="eq-btn {currentEq === preset ? 'eq-active' : ''}" on:click={() => changeEq(preset)}>{preset}</button>
          {/each}
        </div>
      </div>

    {:else if activeApp === 'lyrics'}
      <div class="app-inner-view scrollable">
        <h3 class="app-title">Liner Notes & Credits</h3>
        <div class="metadata-card">
          <p><strong>Track:</strong> {tracks[currentIndex]?.title || 'N/A'}</p>
          <p><strong>MusicBrainz / Discogs:</strong></p>
          <p>{metadataInfo?.trackFacts || 'Loading credits...'}</p>
          <p>{metadataInfo?.albumFacts || 'Loading pressing records...'}</p>
        </div>
      </div>

    {:else if activeApp === 'visualizer'}
      <div class="app-inner-view">
        <div class="vis-controls">
          <button class="eq-btn" on:click={() => visualizerMode = (visualizerMode + 1) % 3}>Mode: {visualizerMode}</button>
        </div>
        <NebulaVisualizer {isPlaying} currentTrack={tracks[currentIndex]} {visualizerMode} />
      </div>

    {:else if activeApp === 'playlists'}
      <div class="app-inner-view scrollable">
        <h3 class="app-title">Playlist Manager</h3>
        <div class="playlist-form">
          <input type="text" placeholder="New Playlist Name" bind:value={playlistNameInput} />
          <button class="eq-btn" on:click={saveCurrentPlaylist}>Save Current Queue</button>
        </div>
        <div class="playlist-list">
          {#each Object.keys(playlists) as name}
            <div class="playlist-item">
              <span>{name} ({playlists[name].length} tracks)</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .ios-container { width: 100%; height: 100%; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .ios-status-bar { height: 40px; display: flex; justify-content: space-between; align-items: center; padding: 0 16px; font-size: 13px; font-weight: 600; background: rgba(0,0,0,0.3); backdrop-filter: blur(10px); }
  .back-home-btn { background: rgba(255,255,255,0.15); border: none; color: #38bdf8; padding: 4px 10px; border-radius: 12px; cursor: pointer; font-size: 11px; font-weight: bold; }
  .ios-viewport { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 16px; overflow: hidden; position: relative; }
  .springboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 10px; }
  .app-tile { display: flex; flex-direction: column; align-items: center; cursor: pointer; gap: 6px; text-align: center; font-size: 11px; }
  .tile-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; justify-content: center; align-items: center; font-size: 28px; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
  .music-bg { background: linear-gradient(135deg, #f43f5e, #be123c); }
  .cover-bg { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
  .eq-bg { background: linear-gradient(135deg, #06b6d4, #0e7490); }
  .lyrics-bg { background: linear-gradient(135deg, #10b981, #047857); }
  .visualizer-bg { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .playlist-bg { background: linear-gradient(135deg, #f59e0b, #b45309); }
  .files-bg { background: linear-gradient(135deg, #ec4899, #be185d); }
  .ios-dock { background: rgba(255,255,255,0.15); backdrop-filter: blur(25px); border-radius: 28px; padding: 10px 20px; display: flex; justify-content: space-around; align-items: center; border: 1px solid rgba(255,255,255,0.2); }
  .dock-icon { width: 52px; height: 52px; font-size: 24px; }
  .app-inner-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px; padding: 10px; }
  .scrollable { overflow-y: auto; align-items: stretch; text-align: left; }
  .app-title { font-size: 16px; font-weight: bold; margin: 0 0 10px 0; color: #38bdf8; text-align: center; }
  .big-artwork { width: 160px; height: 160px; border-radius: 16px; background: rgba(255,255,255,0.1); overflow: hidden; display: flex; justify-content: center; align-items: center; box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
  .big-artwork img { width: 100%; height: 100%; object-fit: cover; }
  .no-art { font-size: 48px; color: #64748b; }
  .artist-sub { font-size: 13px; color: #94a3b8; margin: 0; }
  .playback-controls { display: flex; gap: 24px; align-items: center; margin-top: 10px; }
  .playback-controls button { background: none; border: none; font-size: 26px; color: #fff; cursor: pointer; }
  .play-big { font-size: 36px !important; color: #38bdf8 !important; }
  .coverflow-stage { position: relative; width: 100%; height: 140px; display: flex; justify-content: center; align-items: center; }
  .cf-card { position: absolute; width: 110px; height: 110px; background: #334155; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); transition: transform 0.3s ease; display: flex; justify-content: center; align-items: center; cursor: pointer; }
  .cf-active { border: 2px solid #38bdf8; box-shadow: 0 15px 35px rgba(56,189,248,0.5); }
  .cf-card img { width: 100%; height: 100%; object-fit: cover; }
  .cf-label { font-size: 12px; font-weight: bold; color: #e2e8f0; margin-top: 10px; }
  .eq-preset-list { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 240px; margin: 0 auto; }
  .eq-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
  .eq-active { background: #38bdf8; color: #0f172a; border-color: #38bdf8; }
  .metadata-card { background: rgba(15,23,42,0.8); padding: 12px; border-radius: 12px; font-size: 12px; line-height: 1.4; border: 1px solid rgba(255,255,255,0.1); }
  .playlist-form { display: flex; gap: 8px; margin-bottom: 12px; }
  .playlist-form input { flex: 1; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px; color: #fff; }
  .playlist-list { display: flex; flex-direction: column; gap: 6px; }
  .playlist-item { background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; font-size: 13px; }
</style>
