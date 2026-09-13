<script>
  import { onMount } from 'svelte';
  import { initAudioEngine, playClickSound, setEqPreset } from '@retropod/core/src/audioEngine.js';
  import { scanDirectoryZeroCopy } from '@retropod/core/src/fileSystemStore.js';
  import { fetchAudiophileMetadata } from '@retropod/core/src/metadataService.js';
  import NebulaVisualizer from '@retropod/visualizers/src/NebulaVisualizer.svelte';

  let audioElement;
  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;
  let activeView = 'menu';
  let menuSelection = 0;
  let metadataInfo = null;
  let currentEq = 'Flat';
  let visualizerMode = 0;

  const menuItems = ['Music Library', '3D Cover Flow', 'Wolfson Parametric EQ', 'Lyrics & Liner Notes', 'Nebula Visualizer', 'Settings'];
  const eqPresets = ['Flat', 'Rock', 'Bass Booster', 'Acoustic', 'Classical'];

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

  function selectMenuItem(idx) {
    playClickSound();
    menuSelection = idx;
    if (menuSelection === 0) {
      if (tracks.length === 0) handleOpenDirectory();
      else activeView = 'nowPlaying';
    } else if (menuSelection === 1) {
      activeView = 'coverflow';
    } else if (menuSelection === 2) {
      activeView = 'eq';
    } else if (menuSelection === 3) {
      activeView = 'lyrics';
    } else if (menuSelection === 4) {
      activeView = 'visualizer';
    }
  }

  function handleWheelClick(direction) {
    playClickSound();
    if (activeView === 'menu') {
      menuSelection = (menuSelection + direction + menuItems.length) % menuItems.length;
    } else if (activeView === 'coverflow' && tracks.length > 0) {
      currentIndex = (currentIndex + direction + tracks.length) % tracks.length;
      loadTrack(currentIndex);
    } else if (activeView === 'eq') {
      let idx = eqPresets.indexOf(currentEq);
      idx = (idx + direction + eqPresets.length) % eqPresets.length;
      currentEq = eqPresets[idx];
      setEqPreset(currentEq);
    } else if (activeView === 'visualizer') {
      visualizerMode = (visualizerMode + direction + 3) % 3;
    } else if (tracks.length > 0) {
      let newIdx = (currentIndex + direction + tracks.length) % tracks.length;
      loadTrack(newIdx);
    }
  }

  function handleCenterButton() {
    playClickSound();
    if (activeView === 'menu') {
      selectMenuItem(menuSelection);
    } else {
      activeView = 'menu';
    }
  }
</script>

<audio bind:this={audioElement} on:ended={() => handleWheelClick(1)}></audio>

<div class="pod-container">
  <div class="pod-chassis">
    <div class="lcd-screen">
      <div class="status-bar">
        <span>RetroPod 5G</span>
        <span>{isPlaying ? '▶' : '⏸'}</span>
      </div>
      <div class="screen-content">
        {#if activeView === 'menu'}
          <div class="menu-title">Audio Suite</div>
          <ul>
            {#each menuItems as item, idx}
              <li class={idx === menuSelection ? 'selected' : ''} on:click={() => selectMenuItem(idx)}>{item}</li>
            {/each}
          </ul>
        {:else if activeView === 'coverflow'}
          <div class="coverflow-view" on:click={() => handleWheelClick(1)}>
            <div class="coverflow-stack">
              {#each tracks as t, i}
                <div class="cover-card {i === currentIndex ? 'active-card' : ''}" style="transform: translateX({(i - currentIndex) * 45}px) scale({i === currentIndex ? 1 : 0.85}); z-index: {i === currentIndex ? 10 : 5 - Math.abs(i - currentIndex)};" on:click|stopPropagation={() => loadTrack(i)}>
                  {#if t.artUrl}<img src={t.artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
                </div>
              {/each}
            </div>
            <p class="cf-title">{tracks[currentIndex]?.title || 'Empty Library - Tap to Load'}</p>
          </div>
        {:else if activeView === 'eq'}
          <div class="eq-view" on:click={() => handleWheelClick(1)}>
            <div class="menu-title">Wolfson Parametric EQ</div>
            <p class="eq-status">Active Preset:</p>
            <div class="eq-active-box">{currentEq}</div>
            <p class="hint">Click to Cycle Presets</p>
          </div>
        {:else if activeView === 'lyrics'}
          <div class="lyrics-view">
            <div class="menu-title">Liner Notes & Credits</div>
            <p><strong>Track:</strong> {tracks[currentIndex]?.title || 'N/A'}</p>
            <p class="notes-body">{metadataInfo?.trackFacts || 'Loading MusicBrainz credits...'}</p>
            <p class="notes-body">{metadataInfo?.albumFacts || 'Loading Discogs pressings...'}</p>
          </div>
        {:else if activeView === 'visualizer'}
          <div class="visualizer-mini-wrap" on:click={() => visualizerMode = (visualizerMode + 1) % 3}>
            <NebulaVisualizer {isPlaying} currentTrack={tracks[currentIndex]} {visualizerMode} />
          </div>
        {:else}
          <div class="now-playing">
            <div class="album-art" on:click={handleOpenDirectory}>
              {#if tracks[currentIndex]?.artUrl}<img src={tracks[currentIndex].artUrl} alt="Art" />{:else}<div class="no-art">♪</div>{/if}
            </div>
            <p class="t-title">{tracks[currentIndex]?.title || 'No Track Selected'}</p>
            <p class="t-artist">{tracks[currentIndex]?.artist || 'Click Art to Mount Folder'}</p>
            {#if metadataInfo}<p class="t-credits">{metadataInfo.sourceApi}</p>{/if}
          </div>
        {/if}
      </div>
    </div>

    <div class="click-wheel">
      <button class="btn-menu" on:click={() => activeView = 'menu'}>MENU</button>
      <button class="btn-prev" on:click={() => handleWheelClick(-1)}>⟨⟨</button>
      <button class="btn-next" on:click={() => handleWheelClick(1)}>⟩⟩</button>
      <button class="btn-play" on:click={togglePlay}>⏸/▶</button>
      <button class="btn-center" on:click={handleCenterButton}></button>
    </div>
  </div>
</div>

<style>
  body { background: #0b0f19; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
  .pod-container { display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; }
  .pod-chassis { width: 380px; height: 620px; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); border-radius: 40px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; padding: 25px 20px; box-sizing: border-box; border: 2px solid #94a3b8; }
  .lcd-screen { width: 320px; height: 260px; background: #f8fafc; color: #0f172a; border-radius: 8px; border: 4px solid #334155; display: flex; flex-direction: column; overflow: hidden; box-shadow: inset 0 4px 8px rgba(0,0,0,0.2); position: relative; }
  .status-bar { background: #cbd5e1; padding: 4px 10px; font-size: 11px; font-weight: bold; display: flex; justify-content: space-between; border-bottom: 1px solid #94a3b8; color: #1e293b; }
  .screen-content { padding: 12px; flex: 1; overflow-y: auto; }
  .menu-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; color: #0f172a; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 5px 8px; font-size: 13px; border-radius: 4px; color: #1e293b; cursor: pointer; }
  li.selected { background: #38bdf8; color: #fff; font-weight: bold; }
  .coverflow-view { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; position: relative; cursor: pointer; }
  .coverflow-stack { position: relative; width: 120px; height: 120px; display: flex; justify-content: center; align-items: center; }
  .cover-card { position: absolute; width: 100px; height: 100px; background: #cbd5e1; border-radius: 6px; box-shadow: 0 10px 20px rgba(0,0,0,0.4); transition: transform 0.3s ease; overflow: hidden; display: flex; justify-content: center; align-items: center; cursor: pointer; }
  .active-card { box-shadow: 0 15px 30px rgba(56,189,248,0.6); border: 2px solid #38bdf8; }
  .cover-card img { width: 100%; height: 100%; object-fit: cover; }
  .cf-title { font-size: 11px; font-weight: bold; margin-top: 15px; text-align: center; color: #0f172a; }
  .eq-view { text-align: center; padding-top: 20px; cursor: pointer; }
  .eq-active-box { font-size: 18px; font-weight: bold; background: #38bdf8; color: #fff; padding: 8px; border-radius: 6px; margin: 10px 0; }
  .hint { font-size: 10px; color: #64748b; }
  .lyrics-view { font-size: 11px; color: #334155; line-height: 1.4; }
  .visualizer-mini-wrap { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 5; cursor: pointer; }
  .now-playing { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .album-art { width: 80px; height: 80px; background: #cbd5e1; border-radius: 4px; overflow: hidden; display: flex; justify-content: center; align-items: center; margin-bottom: 6px; cursor: pointer; border: 1px solid #94a3b8; }
  .album-art img { width: 100%; height: 100%; object-fit: cover; }
  .no-art { font-size: 28px; color: #64748b; }
  .t-title { font-weight: bold; font-size: 12px; color: #0f172a; margin: 0; }
  .t-artist { color: #475569; font-size: 11px; margin: 2px 0; }
  .t-credits { font-size: 9px; color: #0284c7; margin-top: 2px; }
  .click-wheel { width: 230px; height: 230px; background: #f1f5f9; border-radius: 50%; margin-top: 20px; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.15); border: 1px solid #cbd5e1; display: flex; justify-content: center; align-items: center; }
  .click-wheel button { position: absolute; background: transparent; border: none; font-size: 11px; font-weight: bold; color: #475569; cursor: pointer; }
  .btn-menu { top: 18px; left: 50%; transform: translateX(-50%); }
  .btn-prev { left: 22px; top: 50%; transform: translateY(-50%); }
  .btn-next { right: 22px; top: 50%; transform: translateY(-50%); }
  .btn-play { bottom: 18px; left: 50%; transform: translateX(-50%); }
  .btn-center { width: 90px; height: 90px; background: #e2e8f0; border-radius: 50%; border: 1px solid #cbd5e1; cursor: pointer; }
</style>
